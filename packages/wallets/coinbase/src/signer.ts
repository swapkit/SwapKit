import { Chain, type ChainApis, pickEvmApiKey } from "@swapkit/helpers";
import type { getToolboxByChain } from "@swapkit/toolbox-evm";

import type { CoinbaseWalletProvider } from "@coinbase/wallet-sdk";
import type { createCoinbaseWalletSDK } from "@coinbase/wallet-sdk/dist/createCoinbaseWalletSDK.js";

export const getWalletForChain = async ({
  chain,
  ethplorerApiKey,
  covalentApiKey,
  apis,
  coinbaseSdk,
}: {
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  apis?: ChainApis;
  coinbaseSdk: ReturnType<typeof createCoinbaseWalletSDK>;
}): Promise<ReturnType<ReturnType<typeof getToolboxByChain>> & { address: string }> => {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-evm");
      const { BrowserProvider } = await import("ethers");

      const api = apis?.[chain];

      const walletProvider = coinbaseSdk.getProvider() as CoinbaseWalletProvider;

      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const apiKey = api
        ? undefined
        : pickEvmApiKey({
            chain,
            nonEthApiKey: covalentApiKey,
            ethApiKey: ethplorerApiKey,
          });

      const toolbox = getToolboxByChain(chain)({
        provider,
        signer,
        api,
        apiKey,
      });

      const address = await signer.getAddress();

      return { ...toolbox, address };
    }

    default:
      throw new Error(`No wallet for chain ${chain}`);
  }
};
