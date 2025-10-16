//TBD @towan to be moved somewhere else

import type { Account } from "@near-js/accounts";
import { type Action, SignedTransaction, type Transaction } from "@near-js/transactions";
import { SwapKitError } from "@swapkit/helpers";
import type { NearSigner } from "@swapkit/toolboxes/near";

/**
 * NEAR Browser Wallet Provider Interface
 * Common interface implemented by browser extension wallets
 */
export interface NearBrowserWalletProvider {
  connect(params?: { contractId?: string; methodNames?: string[] }): Promise<Account[] | { accountId: string }>;
  disconnect?(): Promise<void>;
  signOut?(): Promise<void>; // Alternative to disconnect

  getAccountId(): string | Promise<string>;
  getAccounts?(): Promise<Account[]>;
  isSignedIn(): boolean;
  getPublicKey?(): Promise<string>;

  signMessage?(params: any): Promise<any>;
  signAndSendTransaction(params: { receiverId: string; actions: Action[]; signerId?: string }): Promise<any>;
  signAndSendTransactions?(params: { transactions: Transaction[] }): Promise<any[]>;

  request<T>(params: { method: string; params?: any }): Promise<T>;
  verifyOwner?(params: { message: string; callbackUrl?: string }): Promise<any>;
  getNetwork?(): Promise<{ networkId: string; nodeUrl: string }>;

  on?(event: string, handler: (...args: any[]) => void): void;
  off?(event: string, handler: (...args: any[]) => void): void;
}

/**
 * Helper to create a NEAR signer from browser extension providers
 */
export async function createNearSignerFromProvider(provider: NearBrowserWalletProvider, walletName: string) {
  const isConnected = provider.isSignedIn ? provider.isSignedIn() : false;
  if (!isConnected) {
    await provider.connect({ contractId: "swapkit", methodNames: ["transfer"] });
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
      const { PublicKey } = await import("@near-js/crypto");

      if (provider.getPublicKey) {
        const pubKey = await provider.getPublicKey();
        return PublicKey.from(pubKey);
      }

      throw new SwapKitError("wallet_ledger_method_not_supported", { method: "getPublicKey", wallet: walletName });
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

      const mappedTransaction = {
        actions: transaction.actions.map((action) => actionToWalletJson(action)),
        receiverId: transaction.receiverId,
        signerId: transaction.signerId,
      };

      // @ts-expect-error
      const result: any = await provider.requestSignTransactions({ transactions: [mappedTransaction] });

      const signedTransaction = SignedTransaction.decode(Uint8Array.fromBase64(result.txs[0].signedTx));

      return [signedTransaction.signature.ed25519Signature?.data, signedTransaction] as [
        Uint8Array<ArrayBufferLike>,
        SignedTransaction,
      ];
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

function actionToWalletJson(action: Transaction["actions"][number]) {
  const kind = action.enum;
  const data = action;

  switch (kind) {
    case "functionCall":
    case "FunctionCall":
      return {
        params: {
          // args must be base64 string for wallet JSON
          args: typeof Buffer.from(data.functionCall?.args ?? "{}").toString("base64"),
          deposit: (data.functionCall?.deposit ?? 0).toString(),
          gas: (data.functionCall?.gas ?? 0).toString(),
          methodName: data.functionCall?.methodName ?? "",
        },
        type: "FunctionCall",
      };

    default:
      throw new Error(`Unsupported action kind for wallet JSON: ${kind}`);
  }
}
