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

    // Wait for TronLink to be ready
    await waitForTronLink();

    // Get wallet for Tron chain
    const walletMethods = await getWalletForChain(Chain.Tron);

    // Setup event listeners for account/network changes
    const cleanup = setupEventListeners(walletMethods.address);

    addChain({
      chain: walletMethods.chain as CryptoChain,
      address: walletMethods.address,
      walletType: walletMethods.walletType,
      balance: [], // Initialize with empty balance
      // Include only the required wallet methods
      getAddress: walletMethods.getAddress,
      validateAddress: walletMethods.validateAddress,
      getBalance: walletMethods.getBalance,
      transfer: walletMethods.transfer,
      signTransaction: walletMethods.signTransaction,
      broadcastTransaction: walletMethods.broadcastTransaction,
      disconnect: cleanup, // Use the cleanup function as disconnect
    });

    return true;
  };
}

export const tronlinkWallet = { connectTronLink } as const;
