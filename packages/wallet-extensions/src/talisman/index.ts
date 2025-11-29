import {
  Chain,
  type EVMChain,
  filterSupportedChains,
  prepareNetworkSwitch,
  SwapKitError,
  switchEVMWalletNetwork,
  WalletOption,
} from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import type { Eip1193Provider } from "ethers";

export const talismanWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectTalisman(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods(chain);

          addChain({ ...walletMethods, chain, walletType });
        }),
      );

      return true;
    },
  name: "connectTalisman",
  supportedChains: [
    Chain.Ethereum,
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.Monad,
    Chain.Polygon,
    Chain.BinanceSmartChain,
    Chain.Optimism,
    Chain.XLayer,
    Chain.Polkadot,
    Chain.Chainflip,
  ],
  walletType: WalletOption.TALISMAN,
});

export const TALISMAN_SUPPORTED_CHAINS = getWalletSupportedChains(talismanWallet);

async function getWeb3WalletMethods({
  walletProvider,
  chain,
}: {
  walletProvider: Eip1193Provider | undefined;
  chain: EVMChain;
}) {
  const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
  const { BrowserProvider } = await import("ethers");

  if (!walletProvider) {
    throw new SwapKitError({ errorKey: "wallet_provider_not_found", info: { chain, wallet: WalletOption.TALISMAN } });
  }

  const provider = new BrowserProvider(walletProvider, "any");
  const signer = await provider.getSigner();
  const toolbox = await getEvmToolbox(chain, { provider, signer });

  try {
    if (chain !== Chain.Ethereum) {
      await switchEVMWalletNetwork(provider, chain, toolbox.getNetworkParams());
    }
  } catch {
    throw new SwapKitError({
      errorKey: "wallet_failed_to_add_or_switch_network",
      info: { chain, wallet: WalletOption.TALISMAN },
    });
  }

  return prepareNetworkSwitch({ chain, provider, toolbox });
}

async function getWalletMethods(chain: Chain) {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Monad:
    case Chain.XLayer: {
      if (!(window.talismanEth && "send" in window.talismanEth)) {
        throw new SwapKitError({ errorKey: "wallet_talisman_not_found", info: { chain } });
      }

      const evmWallet = await getWeb3WalletMethods({ chain, walletProvider: window.talismanEth });
      const address: string = (await window.talismanEth.send("eth_requestAccounts", []))[0];

      return { ...evmWallet, address };
    }

    case Chain.Polkadot:
    case Chain.Chainflip: {
      const { getSubstrateToolbox, SubstrateNetwork } = await import("@swapkit/toolboxes/substrate");

      const injectedExtension = window?.injectedWeb3?.talisman;
      const rawExtension = await injectedExtension?.enable?.("talisman");

      if (!rawExtension) {
        throw new SwapKitError({ errorKey: "wallet_talisman_not_enabled", info: { chain } });
      }

      const toolbox = await getSubstrateToolbox(chain, { signer: rawExtension.signer });
      const accounts = await rawExtension.accounts.get();

      if (!accounts[0]?.address) {
        throw new SwapKitError({
          errorKey: "wallet_missing_params",
          info: { accounts, address: accounts[0]?.address, wallet: WalletOption.TALISMAN },
        });
      }
      const address = toolbox.convertAddress(accounts[0].address, SubstrateNetwork[chain].prefix);

      return { ...toolbox, address };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.TALISMAN },
      });
  }
}
