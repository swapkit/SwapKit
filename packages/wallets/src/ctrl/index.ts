import {
  Chain,
  ChainToChainId,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

import { getWalletSupportedChains } from "../utils";
import {
  getCtrlAddress,
  getCtrlMethods,
  getCtrlProvider,
  solanaTransfer,
  walletTransfer,
} from "./walletHelpers";

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
      const { SOLToolbox } = await import("@swapkit/toolboxes/solana");

      const toolbox = SOLToolbox();
      const pubKey = await window.xfi?.solana?.connect();

      if (!pubKey) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      return { ...toolbox, transfer: solanaTransfer(toolbox, pubKey.publicKey) };
    }

    // {
    //   const { getToolboxByChain, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
    //     "@swapkit/toolboxes/cosmos"
    //   );

    //   const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
    //   const toolbox = getToolboxByChain(chain);

    //   return {
    //     ...toolbox(),
    //     deposit: (tx: WalletTxParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
    //     transfer: (tx: WalletTxParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
    //   };
    // }

    case Chain.Maya:
    case Chain.THORChain:
    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/cosmos");

      const chainId = ChainToChainId[chain];

      await window.xfi?.keplr?.enable(chainId);
      // @ts-ignore
      const offlineSigner = window.xfi?.keplr?.getOfflineSignerOnlyAmino(chainId);

      if (!offlineSigner) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      const toolbox = getToolboxByChain(chain)(offlineSigner);

      return {
        ...toolbox,
      };
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/utxo");
      const getToolbox = await getToolboxByChain(chain);
      const toolbox = getToolbox();

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
      const { getToolboxByChain } = await import("@swapkit/toolboxes/evm");
      const { BrowserProvider } = await import("ethers");
      const ethereumWindowProvider = getCtrlProvider(chain);

      if (!ethereumWindowProvider) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = getToolboxByChain(chain)({ provider, signer });
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
