import {
  AssetValue,
  Chain,
  type ChainApis,
  type ChainId,
  ChainToChainId,
  ChainToHexChainId,
  ChainToRPC,
  type ConnectConfig,
  type ConnectWalletParams,
  SwapKitError,
  WalletOption,
  filterSupportedChains,
  pickEvmApiKey,
  setRequestClientConfig,
} from "@swapkit/helpers";
import type { NonETHToolbox } from "@swapkit/toolbox-evm";
import type { Eip1193Provider } from "ethers";
import {
  type WalletTxParams,
  cosmosTransfer,
  getKEEPKEYAddress,
  getKEEPKEYMethods,
  getKEEPKEYProvider,
  getProviderNameFromChain,
  walletTransfer,
} from "./walletHelpers";

const KEEPKEY_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Base,
  Chain.Cosmos,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Kujira,
  Chain.Litecoin,
  Chain.Maya,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Solana,
  Chain.THORChain,
] as const;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO refactor
async function getWalletMethodsForChain({
  apis,
  chain,
  blockchairApiKey,
  covalentApiKey,
  ethplorerApiKey,
}: ConnectConfig & { chain: (typeof KEEPKEY_SUPPORTED_CHAINS)[number]; apis: ChainApis }) {
  switch (chain) {
    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
        "@swapkit/toolbox-cosmos"
      );

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = getToolboxByChain(chain);

      return {
        ...toolbox(),
        deposit: (tx: WalletTxParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
        transfer: (tx: WalletTxParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");
      const toolbox = getToolboxByChain(chain);

      return {
        ...toolbox(),
        transfer: cosmosTransfer({
          chainId: ChainToChainId[chain] as ChainId.Cosmos,
          rpcUrl: ChainToRPC[chain],
        }),
      };
    }

    case Chain.Dash:
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-utxo");
      const toolbox = getToolboxByChain(chain)({ apiKey: blockchairApiKey });

      const getBalance = async () => {
        try {
          const providerChain = getProviderNameFromChain(chain);
          // @ts-expect-error We assuming there chains via switch
          const balance = await window?.keepkey?.[providerChain]?.request({
            method: "request_balance",
          });
          const assetValue = AssetValue.from({ chain, value: balance[0].balance });
          return [assetValue];
        } catch (error) {
          console.error("Error fetching balance:", error);
          throw error;
        }
      };

      return { ...toolbox, getBalance, transfer: walletTransfer };
    }

    case Chain.Ethereum:
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche: {
      const { prepareNetworkSwitch, switchEVMWalletNetwork } = await import("@swapkit/helpers");
      const { getToolboxByChain, getBalance, covalentApi, ethplorerApi, getProvider } =
        await import("@swapkit/toolbox-evm");
      const { BrowserProvider } = await import("ethers");
      const ethereumWindowProvider = getKEEPKEYProvider(chain) as Eip1193Provider;

      if (!ethereumWindowProvider) {
        throw new SwapKitError("wallet_keepkey_not_found");
      }

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });

      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = getToolboxByChain(chain)({ api, apiKey, provider, signer });
      const keepkeyMethods = getKEEPKEYMethods(provider);

      try {
        chain !== Chain.Ethereum &&
          (await switchEVMWalletNetwork(
            provider,
            ChainToHexChainId[chain],
            (toolbox as NonETHToolbox).getNetworkParams(),
          ));
      } catch (_error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { wallet: WalletOption.KEEPKEY, chain },
        });
      }

      if (!((chain === Chain.Ethereum ? ethplorerApiKey : covalentApiKey) || api)) {
        throw new SwapKitError({
          errorKey: "wallet_missing_api_key",
          info: {
            chain,
          },
        });
      }

      const apiWithFallback =
        api || chain === Chain.Ethereum
          ? ethplorerApi(apiKey)
          : covalentApi({ apiKey: apiKey as string, chainId: ChainToChainId[chain] });

      return prepareNetworkSwitch({
        provider,
        chainId: ChainToHexChainId[chain],
        toolbox: {
          ...toolbox,
          ...keepkeyMethods,
          // Overwrite getBalance due to race conditions
          getBalance: (address: string, potentialScamFilter?: boolean) =>
            getBalance({
              chain,
              provider: getProvider(chain),
              api: apiWithFallback,
              address,
              potentialScamFilter,
            }),
        },
      });
    }

    default:
      return null;
  }
}

function connectKeepkeyBex({
  addChain,
  apis,
  config: { covalentApiKey, ethplorerApiKey, blockchairApiKey, thorswapApiKey },
}: ConnectWalletParams) {
  return async (chains: Chain[]) => {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      KEEPKEY_SUPPORTED_CHAINS,
      WalletOption.KEEPKEY_BEX,
    );

    const promises = supportedChains.map(async (chain) => {
      const address = await getKEEPKEYAddress(chain);
      const walletMethods = await getWalletMethodsForChain({
        chain,
        blockchairApiKey,
        covalentApiKey,
        ethplorerApiKey,
        apis,
      });

      addChain({
        ...walletMethods,
        address,
        balance: [],
        chain,
        walletType: WalletOption.KEEPKEY_BEX,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const keepkeyBexWallet = { connectKeepkeyBex } as const;
