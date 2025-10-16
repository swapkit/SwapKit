import { Chain, filterSupportedChains, WalletOption } from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { getExpectedTronNetwork, getWalletForChain, setupEventListeners } from "./helpers.js";

export const tronlinkWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectTronLink(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      if (filteredChains.length === 0) {
        throw new Error("TronLink wallet only supports Tron chain");
      }

      const expectedNetwork = getExpectedTronNetwork(false);

      const walletMethods = await getWalletForChain(Chain.Tron, expectedNetwork);

      const currentAddress = walletMethods.address;

      const cleanup = setupEventListeners(
        (newAddress) => {
          if (newAddress !== currentAddress) {
            window.location.reload();
          }
        },
        (newNetwork) => {
          if (!newNetwork.includes(expectedNetwork)) {
            window.location.reload();
          }
        },
      );

      const disconnect = () => {
        cleanup();
      };

      addChain({ ...walletMethods, balance: [], chain: Chain.Tron, disconnect, walletType });

      return true;
    },
  name: "connectTronLink",
  supportedChains: [Chain.Tron],
  walletType: WalletOption.TRONLINK,
});

export const TRONLINK_SUPPORTED_CHAINS = getWalletSupportedChains(tronlinkWallet);

export * from "./helpers.js";
export * from "./types.js";
