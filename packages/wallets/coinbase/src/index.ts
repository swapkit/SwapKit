import { ChainToChainId, filterSupportedChains, setRequestClientConfig } from "@swapkit/helpers";
import { Chain, type ConnectWalletParams, WalletOption } from "@swapkit/helpers";

import { createCoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import type { CreateCoinbaseWalletSDKOptions } from "@coinbase/wallet-sdk/dist/createCoinbaseWalletSDK";
import { getWalletForChain } from "./signer";

export const COINBASE_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Ethereum,
  Chain.Optimism,
  Chain.Polygon,
] as const;

function connectCoinbaseWallet({
  addChain,
  apis,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey },
  coinbaseWalletSettings,
}: ConnectWalletParams & { coinbaseWalletSettings?: CreateCoinbaseWalletSDKOptions }) {
  return async function connectCoinbaseWallet(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      COINBASE_SUPPORTED_CHAINS,
      WalletOption.COINBASE_MOBILE,
    );

    const coinbaseSdk = createCoinbaseWalletSDK({
      ...coinbaseWalletSettings,
      appChainIds: supportedChains.map((chain) => Number(ChainToChainId[chain])),
    });

    //     const oldCoinbaseSdk = new CoinbaseWalletSDK(coinbaseWalletSettings as any);

    // oldCoinbaseSdk.makeWeb3Provider

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletForChain({
        coinbaseSdk,
        apis,
        chain,
        covalentApiKey,
        ethplorerApiKey,
      });

      addChain({ ...walletMethods, balance: [], chain, walletType: WalletOption.COINBASE_MOBILE });
    });

    await Promise.all(promises);

    return true;
  };
}

export const coinbaseWallet = { connectCoinbaseWallet } as const;
