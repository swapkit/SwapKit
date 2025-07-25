import { Chain, WalletOption, filterSupportedChains } from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { getExpectedTronNetwork, getWalletForChain, setupEventListeners } from "./helpers.js";

export const tronlinkWallet = createWallet({
  name: "connectTronLink",
  walletType: WalletOption.TRONLINK,
  supportedChains: [Chain.Tron],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectTronLink(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      if (filteredChains.length === 0) {
        throw new Error("TronLink wallet only supports Tron chain");
      }

      const expectedNetwork = getExpectedTronNetwork(false);

      const walletMethods = await getWalletForChain(Chain.Tron, expectedNetwork);

      // Store original address for comparison in event listeners
      const currentAddress = walletMethods.address;

      // Setup event listeners for account/network changes
      const cleanup = setupEventListeners(
        (newAddress) => {
          if (newAddress !== currentAddress) {
            // Handle account change - reload to refresh connection
            window.location.reload();
          }
        },
        (newNetwork) => {
          // Handle network change - reload to refresh connection
          if (!newNetwork.includes(expectedNetwork)) {
            window.location.reload();
          }
        },
      );

      // Create disconnect function that cleans up event listeners
      const disconnect = () => {
        cleanup();
      };

      addChain({
        ...walletMethods,
        chain: Chain.Tron,
        balance: [],
        disconnect,
        walletType,
      });

      return true;
    },
});

export const TRONLINK_SUPPORTED_CHAINS = getWalletSupportedChains(tronlinkWallet);
