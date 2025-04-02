import {
  AssetValue,
  Chain,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { CosmosSigner } from "@swapkit/toolboxes/cosmos";
import type { Eip1193Provider } from "ethers";
import { getWalletSupportedChains } from "../utils";
import {
  type WalletTxParams,
  cosmosTransfer,
  getKEEPKEYAddress,
  getKEEPKEYMethods,
  getKEEPKEYProvider,
  getProviderNameFromChain,
  walletTransfer,
} from "./walletHelpers";

export const keepkeyBexWallet = createWallet({
  name: "connectKeepkeyBex",
  supportedChains: [
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
  ],
  walletType: WalletOption.KEEPKEY_BEX,
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectKeepkeyBex(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const address = await getKEEPKEYAddress(chain);
          const walletMethods = await getWalletMethods(chain);

          addChain({ ...walletMethods, address, chain, walletType });
        }),
      );

      return true;
    },
});

export const KEEPKEY_BEX_SUPPORTED_CHAINS = getWalletSupportedChains(keepkeyBexWallet);

async function getWalletMethods(chain: (typeof KEEPKEY_BEX_SUPPORTED_CHAINS)[number]) {
  switch (chain) {
    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
        "@swapkit/toolboxes/cosmos"
      );

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = getToolboxByChain(chain);

      return {
        ...toolbox({} as CosmosSigner),
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
      const getToolbox = await getToolboxByChain(chain);
      const toolbox = getToolbox();

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
      const { getToolboxByChain } = await import("@swapkit/toolboxes/evm");
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
          const networkParams = toolbox.getNetworkParams();
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
        toolbox: { ...toolbox, ...keepkeyMethods },
      });
    }

    default:
      return null;
  }
}
