import {
  type Chain,
  type EVMChain,
  EVMChains,
  filterSupportedChains,
  getChainConfig,
  getRPCUrl,
  WalletOption,
} from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { getWeb3WalletMethods } from "@swapkit/wallet-extensions/evm-extensions";
import type { Eip1193Provider } from "ethers";

export type ConnectMetamaskOptions = {
  dapp?: { name: string; url?: string; iconUrl?: string };
  supportedNetworks?: Record<`0x${string}`, string>;
};

export const metamaskWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectMetamask(chains: Chain[], options?: ConnectMetamaskOptions) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const { createEVMClient } = await import("@metamask/connect-evm");
      const { BrowserProvider } = await import("ethers");

      const supportedNetworks =
        options?.supportedNetworks ??
        (Object.fromEntries(
          await Promise.all(
            filteredChains.map(async (chain) => [getChainConfig(chain).chainIdHex, await getRPCUrl(chain)] as const),
          ),
        ) as Record<`0x${string}`, string>);

      const evmClient = await createEVMClient({
        api: { supportedNetworks },
        dapp: options?.dapp ?? { name: "SwapKit", url: globalThis.location?.href },
      });

      const chainIds = filteredChains.map((chain) => getChainConfig(chain).chainIdHex as `0x${string}`);
      await evmClient.connect({ chainIds });

      const eip1193Provider = evmClient.getProvider() as unknown as Eip1193Provider;

      await Promise.all(
        filteredChains.map(async (chain) => {
          const browserProvider = new BrowserProvider(eip1193Provider, "any");
          const signer = await browserProvider.getSigner();
          const address = await signer.getAddress();

          const walletMethods = await getWeb3WalletMethods({
            address,
            chain,
            provider: browserProvider,
            walletProvider: eip1193Provider,
          });

          addChain({ ...walletMethods, address, chain, disconnect: () => evmClient.disconnect(), walletType });
        }),
      );

      return true;
    },
  name: "connectMetamask",
  supportedChains: [...EVMChains] as EVMChain[],
  walletType: WalletOption.METAMASK,
});

export const METAMASK_SUPPORTED_CHAINS = getWalletSupportedChains(metamaskWallet);
