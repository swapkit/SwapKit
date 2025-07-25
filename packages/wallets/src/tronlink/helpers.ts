import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";
import { type TronSigner, type TronTransaction, createTronToolbox } from "@swapkit/toolboxes/tron";
import type { TronLinkError, TronLinkWindow } from "./types.js";
import { TronLinkResponseCode } from "./types.js";

export async function waitForTronLink(timeout = 3000): Promise<TronLinkWindow> {
  return new Promise((resolve, reject) => {
    let handled = false;

    const handleProvider = () => {
      if (handled) return;
      handled = true;
      window.removeEventListener("tronlink#initialized", handleProvider);
      clearTimeout(timeoutId);

      if (window.tronLink) {
        resolve(window.tronLink);
      } else {
        reject(
          new SwapKitError("wallet_provider_not_found", {
            wallet: WalletOption.TRONLINK,
          }),
        );
      }
    };

    // Check if already available
    if (window.tronLink) {
      handleProvider();
      return;
    }

    // Listen for the initialization event
    window.addEventListener("tronlink#initialized", handleProvider, { once: true });

    // Fallback timeout
    const timeoutId = setTimeout(handleProvider, timeout);
  });
}

export async function getWalletForChain(chain: Chain, expectedNetwork?: string) {
  if (chain !== Chain.Tron) {
    throw new SwapKitError("wallet_chain_not_supported", {
      wallet: WalletOption.TRONLINK,
      chain,
    });
  }

  const tronLink = await waitForTronLink();

  try {
    // Request account access
    const response = await tronLink.request({ method: "tron_requestAccounts" });

    if (response.code !== TronLinkResponseCode.SUCCESS) {
      throw new Error(`TronLink error: ${response.message}`);
    }
  } catch (error: unknown) {
    const tronError = error as TronLinkError;

    // Handle specific error codes
    if (tronError.code === TronLinkResponseCode.REJECTED) {
      throw new SwapKitError("wallet_connection_rejected_by_user");
    }

    if (tronError.code === TronLinkResponseCode.UNAUTHORIZED) {
      throw new SwapKitError("wallet_connection_rejected_by_user", {
        message: "Unauthorized: Please authorize the connection in TronLink",
      });
    }

    // Generic connection error
    throw new SwapKitError("wallet_provider_not_found", {
      wallet: WalletOption.TRONLINK,
      message: tronError.message || "Failed to connect to TronLink",
    });
  }

  // Verify connection
  const address = tronLink.tronWeb.defaultAddress?.base58;
  if (!address) {
    throw new SwapKitError("wallet_provider_not_found", {
      wallet: WalletOption.TRONLINK,
      message: "No account found in TronLink",
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
  const toolbox = await createTronToolbox({
    signer,
  });

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
    throw new SwapKitError("wallet_provider_not_found", {
      wallet: WalletOption.TRONLINK,
    });
  }

  const currentNode = tronLink.tronWeb.fullNode?.host;
  if (currentNode && !currentNode.includes(expectedNetwork)) {
    throw new SwapKitError("wallet_failed_to_add_or_switch_network", {
      wallet: WalletOption.TRONLINK,
      message: `Wrong network. Please switch to ${expectedNetwork} in TronLink.`,
      currentNetwork: currentNode,
      expectedNetwork,
    });
  }
}

export function getExpectedTronNetwork(testnet = false): string {
  return testnet ? "shasta" : "api.trongrid.io";
}
