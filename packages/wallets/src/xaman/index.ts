import {
  Chain,
  SKConfig,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import { Xumm } from "xumm";
import { getWalletSupportedChains } from "../utils";
import { getWalletForChain } from "./helpers.js";
import type { XamanConfig } from "./types.js";
import { connectXamanWallet as connectXamanWalletMethod } from "./walletMethods.js";

export const xamanWallet = createWallet({
  name: "connectXaman",
  walletType: WalletOption.XAMAN,
  supportedChains: [Chain.Ripple],
  connect: ({ addChain, supportedChains: walletSupportedChains, walletType }) =>
    async function connectXamanWallet(chains: Chain[], xamanConfigOverwrite?: XamanConfig) {
      const supportedChains = filterSupportedChains({
        chains,
        supportedChains: walletSupportedChains,
        walletType,
      });

      const { xaman: xamanApiKey } = SKConfig.get("apiKeys");
      const apiKey = xamanConfigOverwrite?.apiKey || xamanApiKey;

      if (!apiKey) {
        throw new SwapKitError("wallet_missing_api_key", { wallet: "Xaman" });
      }

      const xumm = new Xumm(apiKey);

      return new Promise<boolean>((resolve, reject) => {
        xumm.on("success", async () => {
          try {
            const address = await connectXamanWalletMethod(xumm);

            const promises = supportedChains.map(async (chain) => {
              const rpcUrl = SKConfig.get("rpcUrls")[chain];
              const walletMethods = await getWalletForChain({
                xumm,
                chain,
                address,
                rpcUrl,
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
    },
});

export const XAMAN_SUPPORTED_CHAINS = getWalletSupportedChains(xamanWallet);
export type XamanSupportedChain = (typeof XAMAN_SUPPORTED_CHAINS)[number];

export type { XamanConfig } from "./types.js";
