import {
  type AddChainType,
  AssetValue,
  Chain,
  SwapKitError,
  WalletOption,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { NonETHToolbox } from "@swapkit/toolboxes/evm";
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

async function getWalletMethods(chain: (typeof KEEPKEY_SUPPORTED_CHAINS)[number]) {
  switch (chain) {
    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
        "@swapkit/toolboxes/cosmos"
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
      const { getToolboxByChain } = await import("@swapkit/toolboxes/cosmos");
      const toolbox = getToolboxByChain(chain)();

      return { ...toolbox, transfer: cosmosTransfer(chain) };
    }

    case Chain.Dash:
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/utxo");
      const toolbox = getToolboxByChain(chain)();

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
      const { getToolboxByChain, getBalance, getProvider } = await import("@swapkit/toolboxes/evm");
      const { BrowserProvider } = await import("ethers");
      const ethereumWindowProvider = getKEEPKEYProvider(chain) as Eip1193Provider;

      if (!ethereumWindowProvider) {
        throw new SwapKitError("wallet_keepkey_not_found");
      }

      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = getToolboxByChain(chain)({ provider, signer });
      const keepkeyMethods = getKEEPKEYMethods(provider);

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = (toolbox as NonETHToolbox).getNetworkParams();
          await switchEVMWalletNetwork(provider, chain, networkParams);
        }
      } catch (_error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { wallet: WalletOption.KEEPKEY, chain },
        });
      }

      return prepareNetworkSwitch({
        provider,
        chain,
        toolbox: {
          ...toolbox,
          ...keepkeyMethods,
          // Overwrite getBalance due to race conditions
          getBalance: (address: string, potentialScamFilter?: boolean) =>
            getBalance({ chain, provider: getProvider(chain), address, potentialScamFilter }),
        },
      });
    }

    default:
      return null;
  }
}

function connectKeepkeyBex(addChain: AddChainType) {
  return async (chains: Chain[]) => {
    const supportedChains = filterSupportedChains(
      chains,
      KEEPKEY_SUPPORTED_CHAINS,
      WalletOption.KEEPKEY_BEX,
    );

    const promises = supportedChains.map(async (chain) => {
      const address = await getKEEPKEYAddress(chain);
      const walletMethods = await getWalletMethods(chain);

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
