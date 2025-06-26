import type { StdSignDoc } from "@cosmjs/amino";
import {
  Chain,
  ChainId,
  type GenericTransferParams,
  SKConfig,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { ThorchainDepositParams, createThorchainToolbox } from "@swapkit/toolboxes/cosmos";
import type { NearSigner } from "@swapkit/toolboxes/near";
import type { WalletConnectModalSign } from "@walletconnect/modal-sign-html";
import type { SessionTypes, SignClientTypes } from "@walletconnect/types";
import type { Transaction } from "near-api-js/lib/transaction";

import { getWalletSupportedChains } from "../utils";
import {
  DEFAULT_APP_METADATA,
  DEFAULT_COSMOS_METHODS,
  DEFAULT_LOGGER,
  DEFAULT_RELAY_URL,
  THORCHAIN_MAINNET_ID,
} from "./constants";
import { getEVMSigner } from "./evmSigner";
import { chainToChainId, getAddressByChain } from "./helpers";
import { getRequiredNamespaces } from "./namespaces";

export * from "./constants";
export * from "./types";

export const walletconnectWallet = createWallet({
  name: "connectWalletconnect",
  walletType: WalletOption.WALLETCONNECT,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Cosmos,
    Chain.Ethereum,
    Chain.Kujira,
    Chain.Maya,
    Chain.Near,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
  ],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectWalletconnect(
      chains: Chain[],
      walletconnectOptions?: SignClientTypes.Options,
    ) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const { walletConnectProjectId } = SKConfig.get("apiKeys");

      if (!walletConnectProjectId) {
        throw new SwapKitError("wallet_walletconnect_project_id_not_specified");
      }

      const walletconnect = await getWalletconnect(
        filteredChains,
        walletConnectProjectId,
        walletconnectOptions,
      );

      if (!walletconnect) {
        throw new SwapKitError("wallet_walletconnect_connection_not_established");
      }

      const { session, accounts } = walletconnect;

      await Promise.all(
        filteredChains.map(async (chain) => {
          const address = getAddressByChain(chain, accounts);
          const toolbox = await getToolbox({ session, address, chain, walletconnect });

          addChain({
            ...toolbox,
            address,
            chain,
            disconnect: walletconnect.disconnect,
            walletType: WalletOption.WALLETCONNECT,
          });
        }),
      );

      return true;
    },
});

export const WC_SUPPORTED_CHAINS = getWalletSupportedChains(walletconnectWallet);
export type Walletconnect = Awaited<ReturnType<typeof getWalletconnect>>;

async function getToolbox<T extends (typeof WC_SUPPORTED_CHAINS)[number]>({
  chain,
  walletconnect,
  address,
  session,
}: {
  walletconnect: Walletconnect;
  session: SessionTypes.Struct;
  chain: T;
  address: string;
}) {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");

      const provider = await getProvider(chain);
      const signer = await getEVMSigner({ walletconnect, chain, provider });
      const toolbox = await getEvmToolbox(chain, { provider, signer });

      return toolbox;
    }

    case Chain.THORChain: {
      const { SignMode } = await import("cosmjs-types/cosmos/tx/signing/v1beta1/signing.js");
      const { TxRaw } = await import("cosmjs-types/cosmos/tx/v1beta1/tx.js");
      const { encodePubkey, makeAuthInfoBytes } = await import("@cosmjs/proto-signing");
      const { makeSignDoc } = await import("@cosmjs/amino");
      const {
        getCosmosToolbox,
        buildAminoMsg,
        buildEncodedTxBody,
        createStargateClient,
        fromBase64,
        getDefaultChainFee,
        parseAminoMessageForDirectSigning,
      } = await import("@swapkit/toolboxes/cosmos");
      const toolbox = await getCosmosToolbox(Chain.THORChain);

      async function getAccount(accountAddress: string) {
        const cosmosToolbox = toolbox;
        const account = await (
          cosmosToolbox as Awaited<ReturnType<typeof createThorchainToolbox>>
        ).getAccount(accountAddress);

        if (chain !== Chain.THORChain) {
          return account;
        }

        const [{ address, algo, pubkey }] = (await walletconnect?.client.request({
          chainId: THORCHAIN_MAINNET_ID,
          topic: session.topic,
          request: {
            method: DEFAULT_COSMOS_METHODS.COSMOS_GET_ACCOUNTS,
            params: {},
          },
        })) as [{ address: string; algo: string; pubkey: string }];

        return { ...account, address, pubkey: { type: algo, value: pubkey } };
      }

      const fee = getDefaultChainFee(chain);

      const signRequest = (signDoc: StdSignDoc) =>
        walletconnect?.client.request({
          chainId: THORCHAIN_MAINNET_ID,
          topic: session.topic,
          request: {
            method: DEFAULT_COSMOS_METHODS.COSMOS_SIGN_AMINO,
            params: { signerAddress: address, signDoc },
          },
        });

      async function thorchainTransfer({
        assetValue,
        memo,
        ...rest
      }: GenericTransferParams | ThorchainDepositParams) {
        const account = await toolbox.getAccount(address);
        if (!account) {
          throw new SwapKitError({ errorKey: "wallet_missing_params", info: { account } });
        }

        if (!account.pubkey) {
          throw new SwapKitError({
            errorKey: "wallet_missing_params",
            info: { account, pubkey: account?.pubkey },
          });
        }

        const { accountNumber, sequence = 0 } = account;

        const msgs = [buildAminoMsg({ assetValue, memo, sender: address, ...rest })];

        const chainId = ChainId.THORChain;

        const signDoc = makeSignDoc(
          msgs,
          fee,
          chainId,
          memo,
          accountNumber?.toString(),
          sequence?.toString() || "0",
        );

        const signature: any = await signRequest(signDoc);

        const bodyBytes = await buildEncodedTxBody({
          chain: Chain.THORChain,
          msgs: msgs.map(parseAminoMessageForDirectSigning),
          memo: memo || "",
        });
        const pubkey = encodePubkey(account.pubkey);
        const authInfoBytes = makeAuthInfoBytes(
          [{ pubkey, sequence }],
          fee.amount,
          Number.parseInt(fee.gas),
          undefined,
          undefined,
          SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
        );

        const txRaw = TxRaw.fromPartial({
          bodyBytes,
          authInfoBytes,
          signatures: [
            fromBase64(
              typeof signature.signature === "string"
                ? signature.signature
                : signature.signature.signature,
            ),
          ],
        });
        const txBytes = TxRaw.encode(txRaw).finish();

        const broadcaster = await createStargateClient(SKConfig.get("rpcUrls")[Chain.THORChain]);
        const result = await broadcaster.broadcastTx(txBytes);
        return result.transactionHash;
      }

      return {
        ...toolbox,
        transfer: (params: GenericTransferParams) => thorchainTransfer(params),
        deposit: (params: ThorchainDepositParams) => thorchainTransfer(params),
        getAccount,
      };
    }

    case Chain.Near: {
      const { getNearToolbox } = await import("@swapkit/toolboxes/near");
      const { DEFAULT_NEAR_METHODS } = await import("./constants");

      // Create a NEAR signer that uses WalletConnect
      const signer = {
        getPublicKey() {
          // WalletConnect NEAR doesn't expose public key directly
          return Promise.reject(
            new SwapKitError("wallet_walletconnect_method_not_supported", {
              method: "getPublicKey",
            }),
          );
        },

        signNep413Message(
          _message: string,
          _accountId: string,
          _recipient: string,
          _nonce: Uint8Array,
          _callbackUrl?: string,
        ) {
          // WalletConnect NEAR spec doesn't include NEP-413 message signing
          return Promise.reject(
            new SwapKitError("wallet_walletconnect_method_not_supported", {
              method: "signNep413Message",
            }),
          );
        },

        async signTransaction(transaction: Transaction) {
          if (!walletconnect) {
            throw new SwapKitError("wallet_walletconnect_connection_not_established");
          }
          // WalletConnect signs and sends in one operation
          const result = await walletconnect.client.request({
            topic: session.topic,
            chainId: chainToChainId(Chain.Near),
            request: {
              method: DEFAULT_NEAR_METHODS.NEAR_SIGN_AND_SEND_TRANSACTION,
              params: { transaction },
            },
          });
          // Return dummy hash and result
          return [new Uint8Array(32), result];
        },

        signDelegateAction(_delegateAction: any) {
          return Promise.reject(
            new SwapKitError("wallet_walletconnect_method_not_supported", {
              method: "signDelegateAction",
            }),
          );
        },

        getAddress() {
          return Promise.resolve(address);
        },
      } as NearSigner;

      const toolbox = await getNearToolbox({ signer });
      return toolbox;
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.WALLETCONNECT },
      });
  }
}

async function getWalletconnect(
  chains: Chain[],
  walletConnectProjectId?: string,
  walletconnectOptions?: SignClientTypes.Options,
) {
  let modal: WalletConnectModalSign | undefined;
  try {
    if (!walletConnectProjectId) {
      throw new SwapKitError("wallet_walletconnect_project_id_not_specified");
    }
    const requiredNamespaces = getRequiredNamespaces(chains.map(chainToChainId));

    const { WalletConnectModalSign } = await import("@walletconnect/modal-sign-html");

    const client = new WalletConnectModalSign({
      logger: DEFAULT_LOGGER,
      relayUrl: DEFAULT_RELAY_URL,
      projectId: walletConnectProjectId,
      metadata: walletconnectOptions?.metadata || DEFAULT_APP_METADATA,
      ...walletconnectOptions?.core,
    });

    const oldSession = await client.getSession();

    // disconnect old Session cause we can't handle using it with current ui
    if (oldSession) {
      await client.disconnect({
        topic: oldSession.topic,
        reason: { code: 0, message: "Resetting session" },
      });
    }

    const session = await client.connect({ requiredNamespaces });

    const accounts = Object.values(session.namespaces).flatMap(
      (namespace: any) => namespace.accounts,
    );

    const disconnect = async () => {
      await client.disconnect({
        topic: session.topic,
        reason: { code: 0, message: "User disconnected" },
      });
    };

    return { session, accounts, client, disconnect };
  } catch (_e) {
    // Errors are handled by returning undefined
  } finally {
    if (modal) {
      // @ts-expect-error wrong typing
      modal.closeModal();
    }
  }
  return undefined;
}
