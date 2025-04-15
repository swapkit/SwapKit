import {
  Chain,
  ChainToChainId,
  SwapKitError,
  type TransferParams,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

import { getWalletSupportedChains } from "../utils";
import { getCtrlAddress, getCtrlMethods, getCtrlProvider, walletTransfer } from "./walletHelpers";

export const ctrlWallet = createWallet({
  name: "connectCtrl",
  walletType: WalletOption.CTRL,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
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
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectCtrl(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      const promises = filteredChains.map(async (chain) => {
        const address = await getCtrlAddress(chain);
        const walletMethods = await getWalletMethods(chain);

        addChain({ ...walletMethods, address, chain, walletType });
      });

      await Promise.all(promises);

      return true;
    },
});

export const CTRL_SUPPORTED_CHAINS = getWalletSupportedChains(ctrlWallet);

async function getWalletMethods(chain: (typeof CTRL_SUPPORTED_CHAINS)[number]) {
  switch (chain) {
    case Chain.Solana: {
      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");

      const solanaProvider = window.xfi?.solana;

      if (!solanaProvider) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }
      const toolbox = getSolanaToolbox({ signer: solanaProvider });

      return { ...toolbox };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getCosmosToolbox, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
        "@swapkit/toolboxes/cosmos"
      );

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = await getCosmosToolbox(chain);

      return {
        ...toolbox,
        deposit: (tx: TransferParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
        transfer: (tx: TransferParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const chainId = ChainToChainId[chain];
      const provider = await getCtrlProvider(chain);

      await provider?.enable(chainId);
      const signer = provider?.getOfflineSignerOnlyAmino(chainId);

      if (!signer) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      const toolbox = getCosmosToolbox(chain, { signer });

      return toolbox;
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const toolbox = await getUtxoToolbox(chain);

      return { ...toolbox, transfer: walletTransfer };
    }

    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { prepareNetworkSwitch, switchEVMWalletNetwork } = await import("@swapkit/helpers");
      const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const { BrowserProvider } = await import("ethers");
      const ethereumWindowProvider = await getCtrlProvider(chain);

      if (!ethereumWindowProvider) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = await getEvmToolbox(chain, { provider, signer });
      const ctrlMethods = getCtrlMethods(provider);

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = toolbox.getNetworkParams();
          await switchEVMWalletNetwork(provider, chain, networkParams);
        }
      } catch (_error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { wallet: WalletOption.CTRL, chain },
        });
      }

      return prepareNetworkSwitch({
        provider: window.xfi?.ethereum,
        chain,
        toolbox: {
          ...toolbox,
          ...ctrlMethods,
        },
      });
    }

    default:
      return null;
  }
}
