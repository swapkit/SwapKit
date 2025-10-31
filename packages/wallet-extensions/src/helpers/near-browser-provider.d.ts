/**
 * NEAR Browser Wallet Provider Interface Definitions
 *
 * This file contains the standard TypeScript interface definitions for NEAR browser wallet providers
 * that inject themselves into the window object (e.g., OKX, XDEFI/CTRL, etc.)
 *
 * Based on:
 * - NEAR Protocol wallet-selector library
 * - Common patterns from OKX, XDEFI/CTRL, and other NEAR wallet implementations
 * - NEAR API JS types
 */

import type { PublicKey } from "@near-js/crypto";

/**
 * Transaction action types supported by NEAR
 */
export interface NearAction {
  type: "FunctionCall" | "Transfer" | "Stake" | "AddKey" | "DeleteKey" | "DeleteAccount";
  params?: {
    methodName?: string;
    args?: object;
    gas?: string;
    deposit?: string;
    publicKey?: string;
    beneficiaryId?: string;
  };
}

/**
 * Transaction structure for NEAR
 */
export interface NearTransaction {
  receiverId: string;
  actions: NearAction[];
  // Optional fields
  signerId?: string;
  publicKey?: string;
  nonce?: number;
  recentBlockHash?: string;
}

/**
 * Message signing parameters
 */
export interface NearSignMessageParams {
  message: string;
  recipient: string;
  nonce: Buffer | Uint8Array;
  callbackUrl?: string;
  state?: string;
}

/**
 * Signed message response
 */
export interface NearSignedMessage {
  accountId: string;
  publicKey: string;
  signature: string;
  // Optional callback data
  callbackUrl?: string;
  state?: string;
}

/**
 * Sign-in request parameters
 */
export interface NearSignInParams {
  contractId?: string;
  methodNames?: string[];
  // Success and failure URLs for browser wallets
  successUrl?: string;
  failureUrl?: string;
}

/**
 * Account information
 */
export interface NearAccount {
  accountId: string;
  publicKey?: string;
}

/**
 * Access key information
 */
export interface NearAccessKey {
  publicKey: PublicKey;
  accessKey: {
    nonce: number;
    permission: "FullAccess" | { FunctionCall: { allowance?: string; receiverId: string; methodNames: string[] } };
  };
}

/**
 * Transaction execution result
 */
export interface NearFinalExecutionOutcome {
  status: object;
  transaction: object;
  transaction_outcome: object;
  receipts_outcome: object[];
}

/**
 * Standard NEAR browser wallet provider interface
 *
 * This interface represents the common API surface that NEAR browser wallets
 * expose when they inject themselves into the window object.
 */
export interface NearBrowserWalletProvider {
  // Connection Management
  /**
   * Request connection to the wallet
   * Returns array of account IDs that were connected
   */
  connect(): Promise<string[]>;

  /**
   * Alternative connection method used by some wallets
   */
  request?(params: { method: "connect"; params?: any }): Promise<string[]>;

  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;

  /**
   * Sign out from the wallet (some wallets use this instead of disconnect)
   */
  signOut?(): void;

  // Account Management
  /**
   * Check if user is signed in
   */
  isSignedIn?(): boolean;

  /**
   * Get the current account ID
   */
  getAccountId(): string | Promise<string>;

  /**
   * Get list of accounts (some wallets support multiple accounts)
   */
  getAccounts?(): Promise<NearAccount[]>;

  /**
   * Get the public key for the current account
   */
  getPublicKey?(): Promise<string>;

  // Legacy sign-in methods (used by some wallets)
  /**
   * Request sign in (legacy method)
   */
  requestSignIn?(params: NearSignInParams): Promise<NearAccount>;

  // Signing Operations
  /**
   * Sign a message
   */
  signMessage(params: NearSignMessageParams): Promise<NearSignedMessage>;

  /**
   * Sign and send a single transaction
   */
  signAndSendTransaction(params: {
    receiverId: string;
    actions: NearAction[];
    // Optional parameters
    signerId?: string;
    publicKey?: string;
    nonce?: number;
    recentBlockHash?: string;
  }): Promise<NearFinalExecutionOutcome>;

  /**
   * Sign and send multiple transactions
   */
  signAndSendTransactions(params: { transactions: NearTransaction[] }): Promise<NearFinalExecutionOutcome[]>;

  /**
   * Request signing of transactions (alternative method used by some wallets)
   */
  requestSignTransactions?(params: { transactions: NearTransaction[] }): Promise<any>;

  // Verification
  /**
   * Verify ownership of an account
   */
  verifyOwner?(params: {
    message: string;
    // Additional parameters may vary by wallet
  }): Promise<{
    accountId: string;
    publicKey: string;
    signature: string;
    // Additional fields may be returned
  }>;

  // Network Information
  /**
   * Get the current network (mainnet, testnet, etc.)
   */
  getNetwork?(): string | Promise<string>;

  /**
   * Check if wallet is connected to mainnet
   */
  isMainnet?(): boolean;

  // Wallet Metadata
  /**
   * Wallet name or identifier
   */
  name?: string;

  /**
   * Wallet version
   */
  version?: string;

  /**
   * Check if this is a specific wallet (used for wallet detection)
   */
  isOKX?: boolean;
  isXDEFI?: boolean;
  isCTRL?: boolean;

  // Event Handling (not all wallets support events)
  on?(event: "accountsChanged" | "networkChanged" | "disconnect", handler: (...args: any[]) => void): void;
  off?(event: string, handler: (...args: any[]) => void): void;
  removeListener?(event: string, handler: (...args: any[]) => void): void;
}

/**
 * Extended window interface for NEAR wallets
 */
declare global {
  interface Window {
    // Generic NEAR provider (if wallet uses this pattern)
    near?: NearBrowserWalletProvider;

    // Specific wallet providers
    okxwallet?: { near: NearBrowserWalletProvider };

    ctrl?: { near: NearBrowserWalletProvider };

    // Add other wallet-specific providers as needed
  }
}

/**
 * Helper type for wallet detection
 */
export type NearWalletType = "okx" | "xdefi" | "ctrl" | "generic";

/**
 * Configuration for NEAR network
 */
export interface NearNetworkConfig {
  networkId: "mainnet" | "testnet" | "betanet";
  nodeUrl: string;
  walletUrl?: string;
  helperUrl?: string;
}
