import {
  Chain,
  type EVMChain,
  type EthereumWindowProvider,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { InjectedWindow } from "@swapkit/toolboxes/substrate";
import type { Eip1193Provider } from "ethers";
import { getWalletSupportedChains } from "../helpers";

export const talismanWallet = createWallet({
  name: "connectTalisman",
  walletType: WalletOption.TALISMAN,
  supportedChains: [
    Chain.Ethereum,
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.Polygon,
    Chain.BinanceSmartChain,
    Chain.Optimism,
    Chain.Polkadot,
    Chain.Chainflip,
  ],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectTalisman(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const { address, ...walletMethods } = await getWalletMethods(chain);

          addChain({ ...walletMethods, address, chain, walletType });
        }),
      );

      return true;
    },
});

export const TALISMAN_SUPPORTED_CHAINS = getWalletSupportedChains(talismanWallet);

declare const window: {
  talismanEth: EthereumWindowProvider;
} & Window &
  InjectedWindow;

async function getWeb3WalletMethods({
  walletProvider,
  chain,
}: { walletProvider: Eip1193Provider | undefined; chain: EVMChain }) {
  const { getToolboxByChain } = await import("@swapkit/toolboxes/evm");
  const { BrowserProvider } = await import("ethers");

  if (!walletProvider) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.TALISMAN, chain },
    });
  }

  const provider = new BrowserProvider(walletProvider, "any");
  const signer = await provider.getSigner();
  const toolbox = getToolboxByChain(chain)({ provider, signer });

  try {
    if (chain !== Chain.Ethereum) {
      await switchEVMWalletNetwork(provider, chain, toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new SwapKitError({
      errorKey: "wallet_failed_to_add_or_switch_network",
      info: { wallet: WalletOption.TALISMAN, chain },
    });
  }

  return prepareNetworkSwitch({ toolbox, chain, provider });
}

async function getWalletMethods(chain: Chain) {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Base: {
      if (!(window.talismanEth && "send" in window.talismanEth)) {
        throw new SwapKitError({ errorKey: "wallet_talisman_not_found", info: { chain } });
      }
      const { getProvider } = await import("@swapkit/toolboxes/evm");

      const evmWallet = await getWeb3WalletMethods({ chain, walletProvider: window.talismanEth });
      const address: string = (await window.talismanEth.send("eth_requestAccounts", []))[0];

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { walletMethods: { ...evmWallet, getBalance }, address };
    }

    case Chain.Polkadot:
    case Chain.Chainflip: {
      const { getToolboxByChain, Network } = await import("@swapkit/toolboxes/substrate");

      const injectedWindow = window as Window & InjectedWindow;
      const injectedExtension = injectedWindow?.injectedWeb3?.talisman;
      const rawExtension = await injectedExtension?.enable?.("talisman");

      if (!rawExtension) {
        throw new SwapKitError({ errorKey: "wallet_talisman_not_enabled", info: { chain } });
      }

      const toolbox = await getToolboxByChain(chain, { signer: rawExtension.signer });
      const accounts = await rawExtension.accounts.get();

      if (!accounts[0]?.address) {
        throw new SwapKitError({
          errorKey: "wallet_missing_params",
          info: { wallet: WalletOption.TALISMAN, accounts, address: accounts[0]?.address },
        });
      }
      const address = toolbox.convertAddress(accounts[0].address, Network[chain].prefix);

      return {
        ...toolbox,
        getAddress: () => address,
        address,
      };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.TALISMAN },
      });
  }
}
