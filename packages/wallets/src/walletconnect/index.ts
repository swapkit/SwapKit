import type { AminoSignResponse, StdSignDoc } from "@cosmjs/amino";
import {
  Chain,
  type CosmosChain,
  SKConfig,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { GaiaToolbox } from "@swapkit/toolboxes/cosmos";
import type { WalletConnectModalSign } from "@walletconnect/modal-sign-html";
import type { SignClientTypes } from "@walletconnect/types";

import { getWalletSupportedChains } from "../utils";
import {
  CosmosChainToWcChainId,
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

function getWcOfflineAminoSigner(
  walletconnect: Awaited<ReturnType<typeof getWalletconnect>>,
  chain: Chain,
) {
  async function getAccounts() {
    if (!walletconnect) {
      throw new SwapKitError("wallet_walletconnect_connection_not_established");
    }
    const { accounts } = walletconnect;
    return accounts.map((account: any) => ({
      address: account.address,
      algo: account.algo,
      pubkey: account.pubkey,
    }));
  }

  function signAmino(signerAddress: string, signDoc: StdSignDoc) {
    if (!walletconnect) {
      throw new SwapKitError("wallet_walletconnect_connection_not_established");
    }
    return walletconnect.client.request<AminoSignResponse>({
      chainId: CosmosChainToWcChainId[chain as CosmosChain],
      topic: walletconnect.session.topic,
      request: {
        method: DEFAULT_COSMOS_METHODS.COSMOS_SIGN_AMINO,
        params: { signerAddress, signDoc },
      },
    });
  }

  return {
    getAccounts,
    signAmino,
  };
}

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

      await Promise.all(
        filteredChains.map(async (chain) => {
          const address = getAddressByChain(chain, walletconnect.accounts);
          const toolbox = await getToolbox({
            chain,
            walletconnect,
          });

          async function getAccount(accountAddress: string) {
            const account = await (toolbox as unknown as ReturnType<typeof GaiaToolbox>).getAccount(
              accountAddress,
            );
            const [{ address, algo, pubkey }] = (await walletconnect?.client.request({
              chainId: THORCHAIN_MAINNET_ID,
              topic: walletconnect.session.topic,
              request: {
                method: DEFAULT_COSMOS_METHODS.COSMOS_GET_ACCOUNTS,
                params: {},
              },
            })) as [{ address: string; algo: string; pubkey: string }];

            return { ...account, address, pubkey: { type: algo, value: pubkey } };
          }

          addChain({
            ...toolbox,
            address,
            chain,
            disconnect: walletconnect.disconnect,
            walletType: WalletOption.WALLETCONNECT,
            getAccount:
              chain === Chain.THORChain
                ? getAccount
                : (toolbox as unknown as ReturnType<typeof GaiaToolbox>).getAccount,
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
}: {
  walletconnect: Walletconnect;
  chain: T;
}) {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getToolboxByChain } = await import("@swapkit/toolboxes/evm");

      const provider = getProvider(chain);
      const signer = await getEVMSigner({ walletconnect, chain, provider });
      const toolbox = getToolboxByChain(chain);

      return toolbox({ provider, signer });
    }

    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Maya:
    case Chain.THORChain: {
      const { ThorchainToolbox } = await import("@swapkit/toolboxes/cosmos");

      const toolbox = ThorchainToolbox(getWcOfflineAminoSigner(walletconnect, chain));

      return {
        ...toolbox,
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
