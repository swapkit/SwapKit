import { AssetValue, Chain, ChainIdToChain, filterSupportedChains, SwapKitError, WalletOption } from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import type { Eip1193Provider } from "ethers";
import {
  getKEEPKEYAddress,
  getKEEPKEYMethods,
  getKEEPKEYProvider,
  getProviderNameFromChain,
  type WalletTxParams,
  walletTransfer,
} from "./walletHelpers";

export const keepkeyBexWallet = createWallet({
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
    Chain.Ripple,
    Chain.Solana,
    Chain.THORChain,
  ],
  walletType: WalletOption.KEEPKEY_BEX,
});

export const KEEPKEY_BEX_SUPPORTED_CHAINS = getWalletSupportedChains(keepkeyBexWallet);

async function getWalletMethods(chain: (typeof KEEPKEY_BEX_SUPPORTED_CHAINS)[number]) {
  switch (chain) {
    case Chain.Maya:
    case Chain.THORChain: {
      const { getCosmosToolbox, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import("@swapkit/toolboxes/cosmos");

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = await getCosmosToolbox(chain);

      return {
        ...toolbox,
        deposit: (tx: WalletTxParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
        transfer: (tx: WalletTxParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");

      // @ts-expect-error assumed available connection
      const signer = window.keepkey?.cosmos?.getOfflineSignerOnlyAmino(ChainIdToChain[chain]);
      if (!signer) throw new SwapKitError("wallet_keepkey_signer_not_found");
      const toolbox = await getCosmosToolbox(chain, { signer });

      const accounts = await signer.getAccounts();
      if (!accounts?.[0]?.address) throw new SwapKitError("wallet_keepkey_no_accounts");

      const [{ address }] = accounts;

      return { ...toolbox, address };
    }

    case Chain.Dash:
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const toolbox = await getUtxoToolbox(chain);

      const getBalance = async () => {
        const providerChain = getProviderNameFromChain(chain);
        // @ts-expect-error We assuming there chains via switch
        const balance = await window?.keepkey?.[providerChain]?.request({ method: "request_balance" });
        const assetValue = AssetValue.from({ chain, value: balance[0].balance });
        return [assetValue];
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
      const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const { BrowserProvider } = await import("ethers");
      const ethereumWindowProvider = getKEEPKEYProvider(chain) as Eip1193Provider;

      if (!ethereumWindowProvider) {
        throw new SwapKitError("wallet_keepkey_not_found");
      }

      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = await getEvmToolbox(chain, { provider, signer });
      const keepkeyMethods = getKEEPKEYMethods(provider, chain);

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = toolbox.getNetworkParams();
          await switchEVMWalletNetwork(provider, chain, networkParams);
        }
      } catch (_error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { chain, wallet: WalletOption.KEEPKEY },
        });
      }

      return prepareNetworkSwitch({ chain, provider, toolbox: { ...toolbox, ...keepkeyMethods } });
    }

    default:
      return null;
  }
}
