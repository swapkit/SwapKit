//TBD @towan to be moved somewhere else
import { SwapKitError } from "@swapkit/helpers";
import type { NearSigner } from "@swapkit/toolboxes/near";
import type { Account } from "near-api-js";
import { type Action, type Signature, SignedTransaction, type Transaction } from "near-api-js/lib/transaction";

/**
 * NEAR Browser Wallet Provider Interface
 * Common interface implemented by browser extension wallets
 */
export interface NearBrowserWalletProvider {
  // Connection methods
  connect(params?: { contractId?: string; methodNames?: string[] }): Promise<Account[] | { accountId: string }>;
  disconnect?(): Promise<void>;
  signOut?(): Promise<void>; // Alternative to disconnect

  // Account methods
  getAccountId(): string | Promise<string>;
  getAccounts?(): Promise<Account[]>;
  isSignedIn(): boolean;
  getPublicKey?(): Promise<string>;

  // Signing methods
  signMessage?(params: any): Promise<any>;
  signAndSendTransaction(params: { receiverId: string; actions: Action[]; signerId?: string }): Promise<any>;
  signAndSendTransactions?(params: { transactions: Transaction[] }): Promise<any[]>;

  // Optional utility methods
  request<T>(params: { method: string; params?: any }): Promise<T>;
  verifyOwner?(params: { message: string; callbackUrl?: string }): Promise<any>;
  getNetwork?(): Promise<{ networkId: string; nodeUrl: string }>;

  // Event handlers (optional)
  on?(event: string, handler: (...args: any[]) => void): void;
  off?(event: string, handler: (...args: any[]) => void): void;
}

/**
 * Helper to create a NEAR signer from browser extension providers
 */
export async function createNearSignerFromProvider(provider: NearBrowserWalletProvider, walletName: string) {
  const isConnected = provider.isSignedIn ? provider.isSignedIn() : false;
  if (!isConnected) {
    await provider.connect({ contractId: "", methodNames: [] });
  }

  const signer = {
    ...provider,

    async getAddress() {
      if (provider.getAccountId) {
        return provider.getAccountId();
      }

      if (provider.isSignedIn && !provider.isSignedIn()) {
        // Try connect method for wallets that don't have requestSignIn
        const result = await provider.connect();
        if (Array.isArray(result) && result.length > 0 && result[0]) {
          return typeof result[0] === "string" ? result[0] : result[0].accountId;
        }
        throw new SwapKitError("wallet_connection_rejected_by_user", { wallet: walletName });
      }

      throw new SwapKitError("wallet_connection_rejected_by_user", { wallet: walletName });
    },
    async getPublicKey() {
      // Most browser wallets expose public key through message signing
      const { utils } = await import("near-api-js");

      if (provider.getPublicKey) {
        const pubKey = await provider.getPublicKey();
        return utils.PublicKey.from(pubKey);
      }

      if (!provider.signMessage) {
        throw new SwapKitError("wallet_ledger_method_not_supported", { method: "getPublicKey", wallet: walletName });
      }

      // Most browser wallets don't expose public key directly
      // Return a dummy public key
      const { PublicKey } = await import("near-api-js/lib/utils");
      // Create a dummy ed25519 public key
      const dummyKeyData = Buffer.alloc(32);
      const dummyKey = `ed25519:${Buffer.from(dummyKeyData).toString("base64")}`;
      return PublicKey.from(dummyKey);
    },

    signDelegateAction(_delegateAction: any) {
      // Most browser wallets don't support delegate actions yet
      return Promise.reject(
        new SwapKitError("wallet_ledger_method_not_supported", { method: "signDelegateAction", wallet: walletName }),
      );
    },

    async signNep413Message(
      message: string,
      _accountId: string,
      recipient: string,
      nonce: Uint8Array,
      callbackUrl?: string,
    ) {
      if (!provider.signMessage) {
        throw new SwapKitError("wallet_ledger_method_not_supported", {
          method: "signNep413Message",
          wallet: walletName,
        });
      }

      // We know signMessage exists because we checked above
      const result = await (provider as Required<Pick<NearBrowserWalletProvider, "signMessage">>).signMessage({
        callbackUrl,
        message,
        nonce: Buffer.from(nonce),
        recipient,
      });

      return result;
    },

    async signTransaction(transaction: Transaction) {
      if (!provider.request) {
        throw new SwapKitError("wallet_near_method_not_supported", { method: "request", wallet: walletName });
      }

      // Browser wallets typically sign and send in one operation
      // This is a limitation of browser wallet APIs
      const result = await provider.request<{ signatures: Signature }>({
        method: "near_signTransactions",
        params: {
          transactions: [transaction], // must be Array type
        },
      });

      const signedTransaction = new SignedTransaction({ signature: result.signatures, transaction });

      return [result.signatures.data, signedTransaction] as [Uint8Array<ArrayBufferLike>, SignedTransaction];
    },
  };

  return signer as NearSigner;
}

/**
 * Detect if a wallet provider supports NEAR
 */
export function detectNearProvider(window: any, providerPath: string): NearBrowserWalletProvider | null {
  const parts = providerPath.split(".");
  let provider = window;

  for (const part of parts) {
    provider = provider?.[part];
    if (!provider) return null;
  }

  return provider;
}

/**
 * Get NEAR chain ID for WalletConnect
 */
export function getNearChainId(isTestnet: boolean): string {
  return isTestnet ? "near:testnet" : "near:mainnet";
}
