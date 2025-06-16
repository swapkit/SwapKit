/**
 * Near Intents Contract Interface Types
 *
 * This file contains TypeScript interfaces for the intents.near contract methods
 * following the NEP-245 Multi-Token standard and custom intent operations.
 */

// ============== Core Types ==============

export interface Token {
  token_id: string;
  owner_id?: string;
  metadata?: TokenMetadata;
}

export interface TokenMetadata {
  spec: string; // e.g., "ft-1.0.0"
  name: string; // e.g., "Wrapped NEAR"
  symbol: string; // e.g., "wNEAR"
  icon?: string; // Data URL or IPFS link
  reference?: string; // URL to additional metadata
  reference_hash?: string; // Base64-encoded hash of reference content
  decimals: number; // e.g., 24 for NEAR
}

export interface StorageBalance {
  total: string;
  available: string;
}

// ============== View Methods ==============

export interface MTTokensArgs {
  from_index?: string; // Default: "0"
  limit?: number; // Default: unlimited
}

export interface MTTokensForOwnerArgs {
  account_id: string;
  from_index?: string; // Default: "0"
  limit?: number; // Optional limit
}

export interface MTBalanceOfArgs {
  account_id: string;
  token_id: string;
}

export interface MTBatchBalanceOfArgs {
  account_id: string;
  token_ids: string[];
}

export interface MTSupplyArgs {
  token_id: string;
}

export interface MTBatchSupplyArgs {
  token_ids: string[];
}

// ============== Change Methods ==============

export interface MTTransferArgs {
  receiver_id: string;
  token_id: string;
  amount: string;
  approval?: [string, number] | null; // [owner_id, approval_id]
  memo?: string | null;
}

export interface MTBatchTransferArgs {
  receiver_id: string;
  token_ids: string[];
  amounts: string[];
  approvals?: ([string, number] | null)[] | null;
  memo?: string | null;
}

export interface MTTransferCallArgs {
  receiver_id: string;
  token_id: string;
  amount: string;
  approval?: [string, number] | null;
  memo?: string | null;
  msg: string;
}

export interface MTBatchTransferCallArgs {
  receiver_id: string;
  token_ids: string[];
  amounts: string[];
  approvals?: ([string, number] | null)[] | null;
  memo?: string | null;
  msg: string;
}

// ============== Intent-Specific Types ==============

export interface MTWithdrawArgs {
  token_ids: string[];
  amounts: string[];
  recipient?: string; // Optional, defaults to caller
}

export interface IntentsBalance {
  account_id: string;
  balances: Record<string, string>; // token_id -> amount
}

// ============== Contract Interface ==============

export interface IntentsNearContract {
  // View methods (no gas required)
  mt_tokens(args: MTTokensArgs): Promise<Token[]>;
  mt_tokens_for_owner(args: MTTokensForOwnerArgs): Promise<Token[]>;
  mt_balance_of(args: MTBalanceOfArgs): Promise<string>;
  mt_batch_balance_of(args: MTBatchBalanceOfArgs): Promise<string[]>;
  mt_supply(args: MTSupplyArgs): Promise<string | null>;
  mt_batch_supply(args: MTBatchSupplyArgs): Promise<(string | null)[]>;

  // Change methods (require gas)
  mt_transfer(args: MTTransferArgs, gas?: string, deposit?: string): Promise<void>;
  mt_batch_transfer(args: MTBatchTransferArgs, gas?: string, deposit?: string): Promise<void>;
  mt_transfer_call(args: MTTransferCallArgs, gas?: string, deposit?: string): Promise<void>;
  mt_batch_transfer_call(
    args: MTBatchTransferCallArgs,
    gas?: string,
    deposit?: string,
  ): Promise<void>;
  mt_withdraw(args: MTWithdrawArgs, gas?: string, deposit?: string): Promise<string>;

  // Storage methods
  storage_balance_of(args: { account_id: string }): Promise<StorageBalance | null>;
  storage_deposit(
    args: { account_id?: string; registration_only?: boolean },
    gas?: string,
    deposit?: string,
  ): Promise<StorageBalance>;

  // Intent execution
  execute_intents(args: { signed_intents: SignedIntent[] }, gas?: string): Promise<ExecutionResult>;
}

// ============== Intent Types ==============

export interface SignedIntent {
  intent: NearIntent;
  signature: string;
}

export interface NearIntent {
  id: string;
  creator: string;
  intents: IntentAction[];
  expiration?: number;
  security_deposit?: string;
}

export type IntentAction =
  | SwapIntent
  | TransferIntent
  | FTWithdrawIntent
  | NFTWithdrawIntent
  | MTWithdrawIntent
  | NativeWithdrawIntent;

export interface SwapIntent {
  intent_type: "Swap";
  lose: TokenAmount;
  gain: TokenAmount;
  min_gain?: string;
  max_loss?: string;
}

export interface TransferIntent {
  intent_type: "Transfer";
  token_id: string;
  amount: string;
  recipient: string;
}

export interface FTWithdrawIntent {
  intent_type: "FtWithdraw";
  token_id: string;
  amount: string;
  recipient?: string;
}

export interface NFTWithdrawIntent {
  intent_type: "NftWithdraw";
  token_id: string;
  recipient?: string;
}

export interface MTWithdrawIntent {
  intent_type: "MtWithdraw";
  token_ids: string[];
  amounts: string[];
  recipient?: string;
}

export interface NativeWithdrawIntent {
  intent_type: "NativeWithdraw";
  amount: string;
  recipient?: string;
}

export interface TokenAmount {
  token_id: string;
  amount: string;
}

export interface ExecutionResult {
  transaction_hash: string;
  success: boolean;
  logs?: string[];
}

// ============== Type Guards ==============

export function isToken(obj: any): obj is Token {
  return obj && typeof obj.token_id === "string";
}

export function isTokenArray(obj: any): obj is Token[] {
  return Array.isArray(obj) && obj.every(isToken);
}

export function isStorageBalance(obj: any): obj is StorageBalance {
  return obj && typeof obj.total === "string" && typeof obj.available === "string";
}

export function isSwapIntent(action: IntentAction): action is SwapIntent {
  return action.intent_type === "Swap";
}

export function isTransferIntent(action: IntentAction): action is TransferIntent {
  return action.intent_type === "Transfer";
}

export function isFTWithdrawIntent(action: IntentAction): action is FTWithdrawIntent {
  return action.intent_type === "FtWithdraw";
}

export function isNFTWithdrawIntent(action: IntentAction): action is NFTWithdrawIntent {
  return action.intent_type === "NftWithdraw";
}

export function isMTWithdrawIntent(action: IntentAction): action is MTWithdrawIntent {
  return action.intent_type === "MtWithdraw";
}

export function isNativeWithdrawIntent(action: IntentAction): action is NativeWithdrawIntent {
  return action.intent_type === "NativeWithdraw";
}

export function isValidTokenId(tokenId: string): boolean {
  // Validate intents.near token ID format
  return /^nep141:[a-z0-9-_.]+$/.test(tokenId);
}

// ============== Helper Functions ==============

export function formatTokenId(contractAddress: string): string {
  return `nep141:${contractAddress}`;
}

export function extractContractAddress(tokenId: string): string {
  if (!isValidTokenId(tokenId)) {
    throw new Error(`Invalid token ID format: ${tokenId}`);
  }
  const parts = tokenId.split(":");
  return parts[1] || "";
}

export function createTokenAmount(tokenId: string, amount: string): TokenAmount {
  return { token_id: tokenId, amount };
}

// ============== Constants ==============

export const INTENTS_CONTRACT_ID = "intents.near";
export const DEFAULT_GAS = "100000000000000"; // 100 TGas
export const EXECUTE_INTENTS_GAS = "300000000000000"; // 300 TGas
export const STORAGE_DEPOSIT_GAS = "50000000000000"; // 50 TGas
export const ONE_YOCTO_NEAR = "1";

// ============== Method Names ==============

export const IntentsMethods = {
  // View methods
  MT_TOKENS: "mt_tokens",
  MT_TOKENS_FOR_OWNER: "mt_tokens_for_owner",
  MT_BALANCE_OF: "mt_balance_of",
  MT_BATCH_BALANCE_OF: "mt_batch_balance_of",
  MT_SUPPLY: "mt_supply",
  MT_BATCH_SUPPLY: "mt_batch_supply",
  STORAGE_BALANCE_OF: "storage_balance_of",

  // Change methods
  MT_TRANSFER: "mt_transfer",
  MT_BATCH_TRANSFER: "mt_batch_transfer",
  MT_TRANSFER_CALL: "mt_transfer_call",
  MT_BATCH_TRANSFER_CALL: "mt_batch_transfer_call",
  MT_WITHDRAW: "mt_withdraw",
  STORAGE_DEPOSIT: "storage_deposit",
  EXECUTE_INTENTS: "execute_intents",
  NEAR_DEPOSIT: "near_deposit",
} as const;

export type IntentsMethodName = (typeof IntentsMethods)[keyof typeof IntentsMethods];
