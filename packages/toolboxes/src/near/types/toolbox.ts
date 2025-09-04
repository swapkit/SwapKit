import type { AssetValue, DerivationPathArray } from "@swapkit/helpers";
import type { Account, Contract, providers } from "near-api-js";
import type { Action, SignedTransaction, Transaction } from "near-api-js/lib/transaction";
import type { NEP141Token } from "../helpers/nep141";
import type { NearCreateTransactionParams, NearFunctionCallParams, NearSigner, NearTransferParams } from "../types";
import type { NearContractInterface, NearGasEstimateParams } from "../types/contract";

// Type for serialized transaction data
export interface SerializedTransaction {
  serialized: string;
  publicKey: string;
  details: { signerId: string; receiverId?: string; methodName?: string; nonce: number; blockHash: string };
}

// Type for batch transaction
export interface BatchTransaction {
  receiverId: string;
  actions: Action[];
}

// Type for contract function call parameters
export interface ContractFunctionCallParams {
  sender: string;
  contractId: string;
  methodName: string;
  args: Record<string, any>;
  gas: string;
  attachedDeposit: string;
}

// Type for getSignerFromPhrase params
export interface GetSignerFromPhraseParams {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}

// Main toolbox return type
export interface NearToolbox {
  getAddress: () => Promise<string>;
  getPublicKey: () => Promise<string>;
  provider: providers.JsonRpcProvider;
  transfer: (params: NearTransferParams) => Promise<string>;
  createTransaction: (params: NearCreateTransactionParams) => Promise<SerializedTransaction>;
  createContractFunctionCall: (params: ContractFunctionCallParams) => Promise<SerializedTransaction>;
  estimateTransactionFee: (params: NearTransferParams | NearGasEstimateParams) => Promise<AssetValue>;
  broadcastTransaction: (signedTransaction: SignedTransaction) => Promise<string>;
  signTransaction: (transaction: Transaction) => Promise<SignedTransaction>;
  signAndBroadcastTransaction: (transaction: Transaction) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  getBalance: (address: string) => Promise<AssetValue[]>;
  validateAddress: (address: string) => boolean;
  getSignerFromPhrase: (params: GetSignerFromPhraseParams) => Promise<NearSigner>;
  getSignerFromPrivateKey: (privateKey: string) => Promise<NearSigner>;
  callFunction: (params: NearFunctionCallParams) => Promise<string>;
  createSubAccount: (subAccountId: string, publicKey: string, initialBalance: string) => Promise<string>;
  createContract: <T extends Contract = Contract>(contractInterface: NearContractInterface) => Promise<T>;
  executeBatchTransaction: (batch: BatchTransaction) => Promise<string>;
  nep141: (contractId: string) => Promise<NEP141Token>;
  getGasPrice: () => Promise<string>;
  estimateGas: (params: NearGasEstimateParams, account?: Account) => Promise<AssetValue>;
}
