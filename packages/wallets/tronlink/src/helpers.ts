import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";
import { type TronSigner, type TronTransaction, createTronToolbox } from "@swapkit/toolbox-tron";
import type { TronLinkWindow } from "./types.js";
import { TronLinkResponseCode } from "./types.js";

export async function waitForTronLink(timeout = 3000): Promise<TronLinkWindow> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkInterval = setInterval(() => {
      // Check if tronLink exists (not ready state)
      if (window.tronLink) {
        clearInterval(checkInterval);
        resolve(window.tronLink);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(
          new SwapKitError("wallet_provider_not_found", {
            wallet: WalletOption.TRONLINK,
          }),
        );
      }
    }, 10);
  });
}

export async function getWalletForChain(chain: Chain) {
  if (chain !== Chain.Tron) {
    throw new SwapKitError("wallet_chain_not_supported", {
      wallet: WalletOption.TRONLINK,
      chain,
    });
  }

  debugger;
  const tronLink = window.tronLink;
  if (!tronLink) {
    throw new SwapKitError("wallet_provider_not_found", {
      wallet: WalletOption.TRONLINK,
    });
  }

  // Request account access (this will also initialize TronLink if not ready)
  const response = await tronLink.request({ method: "tron_requestAccounts" });

  if (response.code !== TronLinkResponseCode.SUCCESS) {
    if (
      response.code === TronLinkResponseCode.REJECTED ||
      response.code === TronLinkResponseCode.CANCELED
    ) {
      throw new SwapKitError("wallet_connection_rejected_by_user");
    }
    // For other error codes, throw a generic connection error
    throw new SwapKitError("wallet_provider_not_found", {
      wallet: WalletOption.TRONLINK,
      message: response.message || "Failed to connect to TronLink",
    });
  }

  // Verify connection
  const address = tronLink.tronWeb.defaultAddress?.base58;
  if (!address) {
    throw new SwapKitError("wallet_provider_not_found", {
      wallet: WalletOption.TRONLINK,
    });
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

  // Return wallet methods with additional wallet-specific properties
  return {
    ...toolbox,
    address,
    chain: Chain.Tron,
    walletType: WalletOption.TRONLINK,
  };
}

export function setupEventListeners(currentAddress: string): () => void {
  const messageHandler = (event: MessageEvent) => {
    if (event.data?.message?.action === "setAccount") {
      const newAddress = event.data.message.data.address;
      if (newAddress !== currentAddress) {
        // Handle account change - typically reload the page or update state
        window.location.reload();
      }
    }

    if (event.data?.message?.action === "setNode") {
      // Handle network change if needed
      // Network change: event.data.message.data.node
    }
  };

  window.addEventListener("message", messageHandler);

  // Return cleanup function
  return () => window.removeEventListener("message", messageHandler);
}

// Helper to verify network
export function verifyNetwork(expectedNetwork?: string) {
  if (!expectedNetwork) return; // Skip if no expected network

  const tronLink = window.tronLink;
  if (!tronLink) return;

  const currentNode = tronLink.tronWeb.fullNode?.host;
  if (currentNode && !currentNode.includes(expectedNetwork)) {
    throw new SwapKitError("wallet_failed_to_add_or_switch_network", {
      wallet: WalletOption.TRONLINK,
      currentNetwork: currentNode,
      expectedNetwork,
    });
  }
}
