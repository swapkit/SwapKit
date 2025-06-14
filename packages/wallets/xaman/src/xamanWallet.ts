import {
  Chain,
  type ConnectWalletParams,
  RPC_URLS,
  WalletOption,
  filterSupportedChains,
  setRequestClientConfig,
} from "@swapkit/helpers";
import { Xumm } from "xumm";
import { getWalletForChain } from "./helpers.js";
import type { XamanConnectConfig } from "./types.js";
import { connectXamanWallet as connectXamanWalletMethod } from "./walletMethods.js";

export const XAMAN_SUPPORTED_CHAINS = [Chain.Ripple] as const;

function connectXaman({
  addChain,
  apis,
  config: { thorswapApiKey, xamanConfig },
  rpcUrls,
}: ConnectWalletParams) {
  return async function connectXamanWallet(
    chains: Chain[],
    xamanConfigOverwrite?: XamanConnectConfig,
  ) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      XAMAN_SUPPORTED_CHAINS,
      WalletOption.XAMAN,
    );

    const apiKey = xamanConfigOverwrite?.apiKey || xamanConfig?.apiKey;

    if (!apiKey) {
      throw new Error("Xaman API credentials are required");
    }

    const xumm = new Xumm(apiKey);

    return new Promise<boolean>((resolve, reject) => {
      xumm.on("success", async () => {
        try {
          const address = await connectXamanWalletMethod(xumm);

          const promises = supportedChains.map(async (chain) => {
            const walletMethods = await getWalletForChain({
              xumm,
              apis,
              chain,
              address,
              rpcUrl: rpcUrls[chain] || RPC_URLS[Chain.Ripple],
            });

            addChain({
              ...walletMethods,
              chain,
              balance: [],
              walletType: WalletOption.XAMAN,
              address,
              disconnect: xumm.logout,
            });
          });

          await Promise.all(promises);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      xumm.on("error", (error) => {
        reject(error);
      });

      xumm.authorize();
    });
  };
}

export const xamanWallet = { connectXaman } as const;
