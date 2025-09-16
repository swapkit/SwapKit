import {
  Chain,
  ChainToChainId,
  filterSupportedChains,
  type GenericTransferParams,
  SwapKitError,
  WalletOption,
} from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

import { getCtrlAddress, getCtrlProvider, walletTransfer } from "./walletHelpers";

export const ctrlWallet = createWallet({
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
  name: "connectCtrl",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Aurora,
    Chain.Avalanche,
    Chain.Base,
    Chain.Berachain,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Gnosis,
    Chain.Kujira,
    Chain.Litecoin,
    Chain.Maya,
    Chain.Near,
    Chain.Noble,
    Chain.Optimism,
    Chain.Polygon,
    Chain.Solana,
    Chain.THORChain,
  ],
  walletType: WalletOption.CTRL,
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
      const toolbox = await getSolanaToolbox({ signer: solanaProvider });

      return toolbox;
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getCosmosToolbox, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import("@swapkit/toolboxes/cosmos");

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = await getCosmosToolbox(chain);

      return {
        ...toolbox,
        deposit: (tx: GenericTransferParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
        transfer: (tx: GenericTransferParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Noble: {
      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const chainId = ChainToChainId[chain];
      const provider = await getCtrlProvider(chain);

      await provider?.enable(chainId);
      const signer = provider?.getOfflineSignerOnlyAmino(chainId, { preferNoSetFee: true });

      if (!signer) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      const toolbox = await getCosmosToolbox(chain, { signer });

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
    case Chain.Aurora:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.Berachain:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Gnosis:
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

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = toolbox.getNetworkParams();
          await switchEVMWalletNetwork(provider, chain, networkParams);
        }
      } catch (_error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { chain, wallet: WalletOption.CTRL },
        });
      }

      return prepareNetworkSwitch({ chain, provider, toolbox });
    }

    case Chain.Near: {
      if (!window.xfi?.near) {
        throw new SwapKitError("wallet_ctrl_not_found", { chain: Chain.Near });
      }

      const { createNearSignerFromProvider } = await import("../helpers/near");
      const { getNearToolbox } = await import("@swapkit/toolboxes/near");

      const provider = window.xfi.near;
      const signer = await createNearSignerFromProvider(provider, "CTRL");
      const accountId = await signer.getAddress();
      const toolbox = await getNearToolbox({ signer });

      const transfer = async (params: GenericTransferParams) => {
        const { transfer: transferAction } = await import("near-api-js/lib/transaction");

        const amountInYocto = params.assetValue.getBaseValue("string");
        const action = transferAction(BigInt(amountInYocto));

        const transaction = { actions: [action], receiverId: params.recipient, signerId: accountId };

        const txHash: string = await provider.request({ method: "signAndSendTransaction", params: { transaction } });

        return txHash;
      };

      return { ...toolbox, transfer };
    }

    default:
      return null;
  }
}
