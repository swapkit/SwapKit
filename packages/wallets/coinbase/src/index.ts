import type { CoinbaseWalletSDKOptions } from "@coinbase/wallet-sdk/dist/CoinbaseWalletSDK";
import { filterSupportedChains, setRequestClientConfig } from "@swapkit/helpers";
import { Chain, type ConnectWalletParams, WalletOption } from "@swapkit/helpers";

import { getWalletForChain } from "./signer.js";

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
}: ConnectWalletParams & { coinbaseWalletSettings?: CoinbaseWalletSDKOptions }) {
  return async function connectCoinbaseWallet(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      COINBASE_SUPPORTED_CHAINS,
      WalletOption.COINBASE_MOBILE,
    );

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletForChain({
        apis,
        chain,
        covalentApiKey,
        ethplorerApiKey,
        coinbaseWalletSettings,
      });

      addChain({ ...walletMethods, balance: [], chain, walletType: WalletOption.COINBASE_MOBILE });
    });

    await Promise.all(promises);

    return true;
  };
}

export const coinbaseWallet = { connectCoinbaseWallet } as const;
