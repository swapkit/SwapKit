import {
  Chain,
  type CosmosChain,
  type EVMChain,
  filterSupportedChains,
  type GenericTransferParams,
  type SubstrateChain,
  SwapKitError,
  type TCLikeChain,
  type UTXOChain,
  UTXOChains,
  WalletOption,
} from "@swapkit/helpers";

import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import {
  getVultisigAddress,
  getVultisigMethods,
  getVultisigProvider,
  prepareNetworkSwitchCosmos,
  walletTransfer,
} from "./walletHelpers";

export const vultisigWallet = createWallet({
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectVultisig(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      const promises = filteredChains
        .filter((chain) => chain !== Chain.Cosmos && chain !== Chain.Kujira)
        .map(async (chain) => {
          const address = await getVultisigAddress(chain);
          const walletMethods = await getWalletMethods(chain);

          addChain({ ...walletMethods, address, chain, walletType });
        });

      const cosmosIncluded = filteredChains.includes(Chain.Cosmos);
      const kujiraIncluded = filteredChains.includes(Chain.Kujira);

      // Race condition single cosmos provider exposed.
      if (cosmosIncluded) {
        const addressCosmos = await getVultisigAddress(Chain.Cosmos);
        const walletMethodsCosmos = await getWalletMethods(Chain.Cosmos);
        addChain({ ...walletMethodsCosmos, address: addressCosmos, chain: Chain.Cosmos, walletType });
      }
      if (kujiraIncluded) {
        const addressKujira = await getVultisigAddress(Chain.Kujira);
        const walletMethodsKujira = await getWalletMethods(Chain.Kujira);
        addChain({ ...walletMethodsKujira, address: addressKujira, chain: Chain.Kujira, walletType });
      }
      //--//

      await Promise.all(promises);

      return true;
    },
  name: "connectVultisig",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Kujira,
    Chain.Litecoin,
    Chain.Maya,
    Chain.Optimism,
    Chain.Polkadot,
    Chain.Polygon,
    Chain.Ripple,
    Chain.Solana,
    Chain.THORChain,
    Chain.Zcash,
  ],
  walletType: WalletOption.VULTISIG,
});

export const VULTISIG_SUPPORTED_CHAINS = getWalletSupportedChains(vultisigWallet);

async function getWalletMethods(chain: (typeof VULTISIG_SUPPORTED_CHAINS)[number]) {
  const { match } = await import("ts-pattern");
  return match(chain)
    .with(Chain.Solana, async () => {
      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const solanaProvider = window.vultisig?.solana;
      if (!solanaProvider) throw new SwapKitError("wallet_vultisig_not_found");
      const toolbox = await getSolanaToolbox({ signer: solanaProvider });
      return { ...toolbox };
    })

    .with(Chain.Maya, Chain.THORChain, async () => {
      const { getCosmosToolbox, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import("@swapkit/toolboxes/cosmos");
      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = await getCosmosToolbox(chain as Exclude<CosmosChain, TCLikeChain>);
      return {
        ...toolbox,
        deposit: (tx: GenericTransferParams) => walletTransfer({ ...tx, recipient: "" }, "deposit_transaction"),
        transfer: (tx: GenericTransferParams) => walletTransfer({ ...tx, gasLimit }, "send_transaction"),
      };
    })

    .with(Chain.Cosmos, Chain.Kujira, async () => {
      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const provider = await getVultisigProvider(chain as Exclude<CosmosChain, TCLikeChain>);
      const toolbox = await getCosmosToolbox(chain as Exclude<CosmosChain, TCLikeChain>);
      return prepareNetworkSwitchCosmos({ chain, provider, toolbox: { ...toolbox, transfer: walletTransfer } });
    })

    .with(...UTXOChains, async () => {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const toolbox = await getUtxoToolbox(chain as UTXOChain);
      return { ...toolbox, transfer: walletTransfer };
    })

    .with(
      Chain.Arbitrum,
      Chain.Avalanche,
      Chain.Base,
      Chain.BinanceSmartChain,
      Chain.Ethereum,
      Chain.Optimism,
      Chain.Polygon,
      async () => {
        const { prepareNetworkSwitch, switchEVMWalletNetwork } = await import("@swapkit/helpers");
        const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
        const { BrowserProvider } = await import("ethers");
        const ethereumWindowProvider = await getVultisigProvider(chain as EVMChain);

        if (!ethereumWindowProvider) {
          throw new SwapKitError("wallet_vultisig_not_found");
        }

        const provider = new BrowserProvider(ethereumWindowProvider, "any");
        const signer = await provider.getSigner();
        const toolbox = await getEvmToolbox(chain as EVMChain, { provider, signer });
        const vultisigMethods = getVultisigMethods(provider, chain as EVMChain);

        try {
          if (chain !== Chain.Ethereum) {
            const networkParams = toolbox.getNetworkParams();
            await switchEVMWalletNetwork(provider, chain, networkParams);
          }
        } catch (_error) {
          throw new SwapKitError({
            errorKey: "wallet_failed_to_add_or_switch_network",
            info: { chain, wallet: WalletOption.VULTISIG },
          });
        }

        return prepareNetworkSwitch({ chain, provider, toolbox: { ...toolbox, ...vultisigMethods } });
      },
    )

    .with(Chain.Ripple, async () => {
      const { getRippleToolbox } = await import("@swapkit/toolboxes/ripple");
      const toolbox = await getRippleToolbox();
      return { ...toolbox, transfer: walletTransfer };
    })

    .with(Chain.Polkadot, async () => {
      const { getSubstrateToolbox } = await import("@swapkit/toolboxes/substrate");
      const toolbox = await getSubstrateToolbox(chain as SubstrateChain);
      return { ...toolbox, transfer: walletTransfer };
    })

    .otherwise(async () => null);
}
