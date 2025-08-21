import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";
import { createTronToolbox, type TronSigner, type TronTransaction } from "@swapkit/toolboxes/tron";
import type { TronLinkError, TronLinkWindow } from "./types.js";
import { TronLinkResponseCode } from "./types.js";

export function waitForTronLink(timeout = 3000): Promise<TronLinkWindow> {
  return new Promise((resolve, reject) => {
    let handled = false;

    const handleProvider = () => {
      if (handled) return;
      handled = true;
      window.removeEventListener("tronlink#initialized", handleProvider);
      if (timeoutId) clearTimeout(timeoutId);

      if (window.tronLink) {
        resolve(window.tronLink);
      } else {
        reject(new SwapKitError("wallet_provider_not_found", { wallet: WalletOption.TRONLINK }));
      }
    };

    // Check if already available
    if (window.tronLink) {
      resolve(window.tronLink);
      return;
    }

    // Listen for the initialization event
    window.addEventListener("tronlink#initialized", handleProvider, { once: true });

    // Fallback timeout
    const timeoutId = setTimeout(handleProvider, timeout);
  });
}

/**
 * Helper function to check if TronLink wallet is locked
 * Returns true if wallet is locked, false if unlocked
 */
export async function isTronLinkLocked(): Promise<boolean> {
  try {
    const tronLink = await waitForTronLink(1000); // Shorter timeout for lock check

    // Check multiple indicators for locked state:
    // 1. No default address is the most reliable indicator
    const hasDefaultAddress = Boolean(tronLink.tronWeb?.defaultAddress?.base58);

    // 2. ready property explicitly false (not undefined)
    // Note: In some versions, ready might be undefined when unlocked, so only check for explicit false
    const isReadyFalse = tronLink.ready === false;

    // 3. tronWeb object completeness check
    const hasTronWeb = Boolean(
      tronLink.tronWeb && typeof tronLink.tronWeb.trx === "object" && typeof tronLink.tronWeb.trx.sign === "function",
    );

    // Wallet is locked if:
    // - No default address AND (ready is false OR tronWeb is incomplete)
    // - This avoids false positives when the wallet is just initializing
    return !hasDefaultAddress && (isReadyFalse || !hasTronWeb);
  } catch {
    // If we can't even get TronLink, it's not available (not necessarily locked)
    return false;
  }
}

/**
 * Helper function to handle TronLink error responses
 */
function handleTronLinkError(error: TronLinkError | Error): never {
  const tronError = error as TronLinkError;

  // Check if the error code indicates locked wallet
  if (tronError.code === TronLinkResponseCode.LOCKED || tronError.code === 4000) {
    throw new SwapKitError("wallet_locked", {
      message: "TronLink is locked. Please unlock it to continue.",
      wallet: WalletOption.TRONLINK,
    });
  }

  // Handle rejection
  if (tronError.code === TronLinkResponseCode.REJECTED || tronError.code === 4001) {
    throw new SwapKitError("wallet_connection_rejected_by_user");
  }

  // Handle unauthorized
  if (tronError.code === TronLinkResponseCode.UNAUTHORIZED || tronError.code === 4100) {
    throw new SwapKitError("wallet_connection_rejected_by_user", {
      message: "Unauthorized: Please authorize the connection in TronLink",
    });
  }

  // Generic connection error
  throw new SwapKitError("wallet_provider_not_found", {
    message: tronError.message || "Failed to connect to TronLink",
    wallet: WalletOption.TRONLINK,
  });
}

/**
 * Helper function to request TronLink accounts
 */
async function requestTronLinkAccounts(tronLink: TronLinkWindow): Promise<void> {
  try {
    const response = await tronLink.request({ method: "tron_requestAccounts" });

    // Check response code for locked state
    if (response.code === TronLinkResponseCode.LOCKED) {
      throw new SwapKitError("wallet_locked", {
        message: "TronLink is locked. Please unlock it to continue.",
        wallet: WalletOption.TRONLINK,
      });
    }

    if (response.code !== TronLinkResponseCode.SUCCESS) {
      throw new Error(`TronLink error: ${response.message}`);
    }
  } catch (error: unknown) {
    handleTronLinkError(error as TronLinkError);
  }
}

export async function getWalletForChain(chain: Chain, expectedNetwork?: string) {
  if (chain !== Chain.Tron) {
    throw new SwapKitError("wallet_chain_not_supported", { chain, wallet: WalletOption.TRONLINK });
  }

  const tronLink = await waitForTronLink();

  // Check if wallet is potentially locked
  const isLocked = await isTronLinkLocked();

  // Always request accounts - this will trigger unlock prompt if needed
  !isLocked && (await requestTronLinkAccounts(tronLink));

  // After successful account request, verify connection
  const address = tronLink.tronWeb?.defaultAddress?.base58;

  if (!address) {
    // If still no address after successful request, wallet might be locked
    if (isLocked) {
      throw new SwapKitError("wallet_locked", {
        message: "TronLink is locked. Please unlock it to continue.",
        wallet: WalletOption.TRONLINK,
      });
    }

    throw new SwapKitError("wallet_provider_not_found", {
      message: "No account found in TronLink",
      wallet: WalletOption.TRONLINK,
    });
  }

  // Verify network if required
  if (expectedNetwork) {
    verifyNetwork(expectedNetwork);
  }

  // Create signer object
  const signer: TronSigner = {
    getAddress: async () => address,
    signTransaction: async (transaction: TronTransaction) => {
      return await tronLink.tronWeb.trx.sign(transaction);
    },
  };

  // Create toolbox with signer
  const toolbox = await createTronToolbox({ signer });

  // Return wallet methods
  return { ...toolbox, address };
}

export function setupEventListeners(
  onAccountChange?: (address: string) => void,
  onNetworkChange?: (network: string) => void,
): () => void {
  const messageHandler = (event: MessageEvent) => {
    if (event.data?.message?.action === "setAccount") {
      const newAddress = event.data.message.data.address;
      if (onAccountChange) {
        onAccountChange(newAddress);
      } else {
        // Default behavior: reload the page
        window.location.reload();
      }
    }

    if (event.data?.message?.action === "setNode") {
      const node = event.data.message.data.node;
      if (onNetworkChange) {
        onNetworkChange(node.fullNode);
      } else {
        // Default behavior: reload the page on network change
        window.location.reload();
      }
    }
  };

  window.addEventListener("message", messageHandler);

  // Return cleanup function
  return () => window.removeEventListener("message", messageHandler);
}

export function verifyNetwork(expectedNetwork: string) {
  const tronLink = window.tronLink;
  if (!tronLink) {
    throw new SwapKitError("wallet_provider_not_found", { wallet: WalletOption.TRONLINK });
  }

  const currentNode = tronLink.tronWeb.fullNode?.host;
  if (currentNode && !currentNode.includes(expectedNetwork)) {
    throw new SwapKitError("wallet_failed_to_add_or_switch_network", {
      currentNetwork: currentNode,
      expectedNetwork,
      message: `Wrong network. Please switch to ${expectedNetwork} in TronLink.`,
      wallet: WalletOption.TRONLINK,
    });
  }
}

export function getExpectedTronNetwork(testnet = false): string {
  return testnet ? "shasta" : "api.trongrid.io";
}
