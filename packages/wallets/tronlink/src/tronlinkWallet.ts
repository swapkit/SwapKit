import {
  Chain,
  type ConnectWalletParams,
  type CryptoChain,
  setRequestClientConfig,
} from "@swapkit/helpers";
import { getWalletForChain, setupEventListeners, waitForTronLink } from "./helpers.js";

function connectTronLink({ addChain, config: { thorswapApiKey } }: ConnectWalletParams) {
  return async function tronlink(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    // Only Tron chain is supported
    const tronLinkChains = [Chain.Tron];
    const supportedChains = chains.filter((chain) => tronLinkChains.includes(chain));

    if (supportedChains.length === 0) {
      throw new Error("TronLink wallet only supports Tron chain");
    }

    // Wait for TronLink to be available
    await waitForTronLink();

    // Get wallet for Tron chain
    const walletMethods = await getWalletForChain(Chain.Tron);

    // Setup event listeners for account/network changes
    const cleanup = setupEventListeners(walletMethods.address);

    addChain({
      ...walletMethods,
      chain: walletMethods.chain as CryptoChain,
      balance: [], // Initialize with empty balance
      disconnect: cleanup, // Use the cleanup function as disconnect
    });

    return true;
  };
}

export const tronlinkWallet = { connectTronLink } as const;
