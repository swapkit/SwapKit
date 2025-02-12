import { type CoinbaseWalletProvider, CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import type { CoinbaseWalletSDKOptions } from "@coinbase/wallet-sdk/dist/CoinbaseWalletSDK";
import { Chain, type ChainApis, ChainToRPC, pickEvmApiKey } from "@swapkit/helpers";
import type { getToolboxByChain } from "@swapkit/toolbox-evm";
import { AbstractSigner, type Provider } from "ethers";

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

export const getWalletForChain = async ({
  chain,
  ethplorerApiKey,
  covalentApiKey,
  apis,
  coinbaseWalletSettings = {
    appName: "Developer App",
  } as CoinbaseWalletSDKOptions,
}: {
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  apis?: ChainApis;
  coinbaseWalletSettings?: CoinbaseWalletSDKOptions;
}): Promise<ReturnType<ReturnType<typeof getToolboxByChain>> & { address: string }> => {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain: {
      const coinbaseWallet = new CoinbaseWalletSDK(coinbaseWalletSettings);

      const api = apis?.[chain];

      const apiKey = api
        ? undefined
        : pickEvmApiKey({
            chain,
            nonEthApiKey: covalentApiKey,
            ethApiKey: ethplorerApiKey,
          });

      const walletProvider = coinbaseWallet.makeWeb3Provider(ChainToRPC[chain]);

      // TODO fix error
      if (!walletProvider) throw new Error("No wallet provider");

      const { getToolboxByChain, getProvider } = await import("@swapkit/toolbox-evm");

      const provider = getProvider(chain);

      const signer = new CoinbaseMobileSigner(walletProvider, provider);

      const params = {
        api,
        provider,
        signer,
      };

      const toolbox = getToolboxByChain(chain)({
        ...params,
        api,
        apiKey,
      });

      return {
        address: await signer.getAddress(),
        ...toolbox,
      };
    }

    default:
      throw new Error(`No wallet for chain ${chain}`);
  }
};
