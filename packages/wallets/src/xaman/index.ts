import { Chain, filterSupportedChains, SKConfig, SwapKitError, WalletOption } from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { Xumm } from "xumm";
import { getWalletForChain } from "./helpers";
import type { XamanConfig } from "./types";
import { connectXamanWallet as connectXamanWalletMethod } from "./walletMethods";

export const xamanWallet = createWallet({
  connect: ({ addChain, supportedChains: walletSupportedChains, walletType }) =>
    function connectXamanWallet(chains: Chain[], xamanConfigOverwrite?: XamanConfig) {
      const supportedChains = filterSupportedChains({ chains, supportedChains: walletSupportedChains, walletType });

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
              const walletMethods = await getWalletForChain({ address, chain, xumm });

              addChain({
                ...walletMethods,
                address,
                balance: [],
                chain,
                disconnect: xumm.logout,
                walletType: WalletOption.XAMAN,
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
  name: "connectXaman",
  supportedChains: [Chain.Ripple],
  walletType: WalletOption.XAMAN,
});

export const XAMAN_SUPPORTED_CHAINS = getWalletSupportedChains(xamanWallet);
export type XamanSupportedChain = (typeof XAMAN_SUPPORTED_CHAINS)[number];

export type { XamanConfig } from "./types";
