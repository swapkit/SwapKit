import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";
import { createTronToolbox, type TronTransaction } from "@swapkit/toolboxes/tron";
import type { TronLinkWindow } from "./types.js";
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

    if (window.tronLink) {
      resolve(window.tronLink);
      return;
    }

    window.addEventListener("tronlink#initialized", handleProvider, { once: true });

    const timeoutId = setTimeout(handleProvider, timeout);
  });
}

export async function isTronLinkLocked() {
  try {
    const tronLink = await waitForTronLink(1000);

    const hasDefaultAddress = Boolean(tronLink.tronWeb?.defaultAddress?.base58);

    const isReady = tronLink.ready !== false;

    const hasTronWeb = Boolean(
      tronLink.tronWeb && typeof tronLink.tronWeb.trx === "object" && typeof tronLink.tronWeb.trx.sign === "function",
    );

    return !hasDefaultAddress && (!isReady || !hasTronWeb);
  } catch {
    return false;
  }
}

async function requestTronLinkAccounts(tronLink: TronLinkWindow) {
  const response = await tronLink.request({ method: "tron_requestAccounts" });

  if (response === "") {
    throw new SwapKitError("wallet_tronlink_locked", { message: "TronLink is locked. Please unlock it to continue." });
  }

  if (response.code !== TronLinkResponseCode.SUCCESS) {
    throw new SwapKitError("wallet_tronlink_request_accounts_failed", {
      code: response.code,
      message: `TronLink requestAccounts failed: ${response.message}`,
    });
  }
}

export async function getWalletForChain(chain: Chain, expectedNetwork?: string) {
  if (chain !== Chain.Tron) {
    throw new SwapKitError("wallet_chain_not_supported", { chain, wallet: WalletOption.TRONLINK });
  }

  const tronLink = await waitForTronLink();
  const isLocked = await isTronLinkLocked();

  isLocked && (await requestTronLinkAccounts(tronLink));

  const address = tronLink.tronWeb?.defaultAddress?.base58;

  if (expectedNetwork) {
    verifyNetwork(expectedNetwork);
  }

  const signer = {
    getAddress: async () => address,
    signTransaction: async (transaction: TronTransaction) => {
      return await tronLink.tronWeb.trx.sign(transaction);
    },
  };

  const toolbox = await createTronToolbox({ signer });

  return { ...toolbox, address };
}

export function setupEventListeners(
  onAccountChange?: (address: string) => void,
  onNetworkChange?: (network: string) => void,
) {
  const messageHandler = (event: MessageEvent) => {
    const eventDataAction = event.data?.message?.action;

    switch (eventDataAction) {
      case "setAccount": {
        const newAddress = event.data.message.data.address;
        if (onAccountChange) {
          onAccountChange(newAddress);
          return;
        }
        window.location.reload();
        return;
      }
      case "setNode": {
        const node = event.data.message.data.node;
        if (onNetworkChange) {
          onNetworkChange(node.fullNode);
        }
        window.location.reload();
        return;
      }
      default:
        return;
    }
  };

  window.addEventListener("message", messageHandler);

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
