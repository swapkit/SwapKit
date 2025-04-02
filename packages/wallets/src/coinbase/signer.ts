import type { CoinbaseWalletProvider } from "@coinbase/wallet-sdk";
import type { createCoinbaseWalletSDK } from "@coinbase/wallet-sdk/dist/createCoinbaseWalletSDK.js";
import { Chain } from "@swapkit/helpers";
import type { Provider } from "ethers";

async function getCoinbaseMobileSigner(
  walletProvider: CoinbaseWalletProvider,
  provider?: Provider,
) {
  const { AbstractSigner } = await import("ethers");

  class CoinbaseMobileSigner extends AbstractSigner {
    #coinbaseProvider: CoinbaseWalletProvider;

    constructor(coinbaseProvider: CoinbaseWalletProvider, provider?: Provider) {
      super(provider);
      this.#coinbaseProvider = coinbaseProvider;
    }

    async getAddress() {
      const accounts = await this.#coinbaseProvider.request<string[]>({
        method: "eth_requestAccounts",
      });

      if (!accounts[0]) throw new Error("No Account found");

      return accounts[0];
    }

    async signTransaction() {
      return await this.#coinbaseProvider.request<string>({
        method: "eth_signTransaction",
      });
    }

    async signMessage(message: string | Uint8Array) {
      return await this.#coinbaseProvider.request<string>({
        method: "personal_sign",
        params: [message, await this.getAddress()],
      });
    }

    signTypedData = () => {
      throw new Error("this method is not implemented");
    };

    connect(provider: Provider) {
      return new CoinbaseMobileSigner(this.#coinbaseProvider, provider);
    }
  }

  return new CoinbaseMobileSigner(walletProvider, provider);
}

export const getWalletMethods = async ({
  chain,
  coinbaseSdk,
}: {
  chain: Chain;
  coinbaseSdk: ReturnType<typeof createCoinbaseWalletSDK>;
}) => {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain: {
      const walletProvider = coinbaseSdk.getProvider() as CoinbaseWalletProvider;

      const { getToolboxByChain, getProvider } = await import("@swapkit/toolboxes/evm");

      const provider = await getProvider(chain);
      const signer = await getCoinbaseMobileSigner(walletProvider, provider);
      const toolbox = getToolboxByChain(chain)({ provider, signer });
      const address = await signer.getAddress();

      return { ...toolbox, address };
    }

    default:
      throw new Error(`No wallet for chain ${chain}`);
  }
};
