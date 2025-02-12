import type { StdSignDoc } from "@cosmjs/amino";
import {
  Chain,
  type ChainApis,
  ChainId,
  type ConnectWalletParams,
  SwapKitError,
  WalletOption,
  filterSupportedChains,
  getRPCUrl,
  pickEvmApiKey,
  setRequestClientConfig,
} from "@swapkit/helpers";
import type { BaseCosmosToolboxType, DepositParam, TransferParams } from "@swapkit/toolbox-cosmos";
import type { WalletConnectModalSign } from "@walletconnect/modal-sign-html";
import type { SessionTypes, SignClientTypes } from "@walletconnect/types";

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

export const WC_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Cosmos,
  Chain.Ethereum,
  Chain.Kujira,
  Chain.Maya,
  Chain.Optimism,
  Chain.Polygon,
  Chain.THORChain,
] as const;

async function getToolbox({
  apis,
  chain,
  walletconnect,
  address,
  session,
  ethplorerApiKey,
  covalentApiKey,
}: {
  apis: ChainApis;
  walletconnect: Walletconnect;
  session: SessionTypes.Struct;
  chain: (typeof WC_SUPPORTED_CHAINS)[number];
  covalentApiKey?: string;
  ethplorerApiKey?: string;
  stagenet?: boolean;
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
      const { getProvider, getToolboxByChain } = await import("@swapkit/toolbox-evm");

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        ethApiKey: ethplorerApiKey,
        nonEthApiKey: covalentApiKey,
      });
      const provider = getProvider(chain);
      const signer = await getEVMSigner({ walletconnect, chain, provider });
      // @ts-expect-error TODO: fix this
      const toolbox = getToolboxByChain(chain)({ api, apiKey, provider, signer });

      return toolbox;
    }

    case Chain.THORChain: {
      const { SignMode } = await import("cosmjs-types/cosmos/tx/signing/v1beta1/signing.js");
      const { TxRaw } = await import("cosmjs-types/cosmos/tx/v1beta1/tx.js");
      const { encodePubkey, makeAuthInfoBytes } = await import("@cosmjs/proto-signing");
      const { makeSignDoc } = await import("@cosmjs/amino");
      const {
        ThorchainToolbox,
        buildAminoMsg,
        buildEncodedTxBody,
        createStargateClient,
        fromBase64,
        getDefaultChainFee,
        parseAminoMessageForDirectSigning,
      } = await import("@swapkit/toolbox-cosmos");
      const toolbox = ThorchainToolbox({ stagenet: false });

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
      }: TransferParams | DepositParam) {
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

        const msgs = [
          buildAminoMsg({ chain: Chain.THORChain, assetValue, memo, from: address, ...rest }),
        ];

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

        const bodyBytes = buildEncodedTxBody({
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

        const broadcaster = await createStargateClient(getRPCUrl(Chain.THORChain));
        const result = await broadcaster.broadcastTx(txBytes);
        return result.transactionHash;
      }

      return {
        ...toolbox,
        transfer: (params: TransferParams) => thorchainTransfer(params),
        deposit: (params: DepositParam) => thorchainTransfer(params),
      };
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
  } catch (e) {
    console.error(e);
  } finally {
    if (modal) {
      // @ts-expect-error wrong typing
      modal.closeModal();
    }
  }
  return undefined;
}

export type Walletconnect = Awaited<ReturnType<typeof getWalletconnect>>;

function connectWalletconnect({
  addChain,
  apis,
  config: {
    thorswapApiKey,
    ethplorerApiKey,
    walletConnectProjectId,
    covalentApiKey,
    stagenet = false,
  },
}: ConnectWalletParams) {
  return async function connectWallet(
    chains: Chain[],
    walletconnectOptions?: SignClientTypes.Options,
  ) {
    const supportedChains = filterSupportedChains(
      chains,
      WC_SUPPORTED_CHAINS,
      WalletOption.WALLETCONNECT,
    );

    setRequestClientConfig({ apiKey: thorswapApiKey });

    const chainsToConnect = supportedChains.filter((chain) => WC_SUPPORTED_CHAINS.includes(chain));
    const walletconnect = await getWalletconnect(
      chainsToConnect,
      walletConnectProjectId,
      walletconnectOptions,
    );

    if (!walletconnect) {
      throw new SwapKitError("wallet_walletconnect_connection_not_established");
    }

    const { session, accounts } = walletconnect;

    const promises = chainsToConnect.map(async (chain) => {
      const address = getAddressByChain(chain, accounts);

      const toolbox = await getToolbox({
        apis,
        session,
        address,
        chain,
        walletconnect,
        ethplorerApiKey,
        covalentApiKey,
        stagenet,
      });

      async function getAccount(accountAddress: string) {
        const account = await (toolbox as BaseCosmosToolboxType).getAccount(accountAddress);
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

      addChain({
        ...toolbox,
        disconnect: walletconnect.disconnect,
        address,
        balance: [],
        chain,
        walletType: WalletOption.WALLETCONNECT,
        getAccount:
          chain === Chain.THORChain ? getAccount : (toolbox as BaseCosmosToolboxType).getAccount,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const walletconnectWallet = { connectWalletconnect } as const;
