import type { AssetValue, DerivationPathArray } from "@swapkit/helpers";
import type { Account, Contract, providers } from "near-api-js";
import type { Action, SignedTransaction, Transaction } from "near-api-js/lib/transaction";
import type { NEP141Token } from "../helpers/nep141";
import type { NearCreateTransactionParams, NearFunctionCallParams, NearSigner, NearTransferParams } from "../types";
import type { NearContractInterface, NearGasEstimateParams } from "../types/contract";

export interface BatchTransaction {
  receiverId: string;
  actions: Action[];
}

export interface ContractFunctionCallParams {
  sender: string;
  contractId: string;
  methodName: string;
  args: Record<string, any>;
  gas: string;
  attachedDeposit: string;
}

export type CreateActionParams = Pick<ContractFunctionCallParams, "methodName" | "args" | "gas" | "attachedDeposit">;

export interface GetSignerFromPhraseParams {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}

export interface NearToolbox {
  getAddress: () => Promise<string>;
  getPublicKey: () => Promise<string>;
  provider: providers.JsonRpcProvider;
  transfer: (params: NearTransferParams) => Promise<string>;
  createAction: (params: CreateActionParams) => Promise<Action>;
  createTransaction: (params: NearCreateTransactionParams) => Promise<Transaction>;
  createContractFunctionCall: (params: ContractFunctionCallParams) => Promise<Transaction>;
  estimateTransactionFee: (params: NearTransferParams | NearGasEstimateParams) => Promise<AssetValue>;
  broadcastTransaction: (signedTransaction: SignedTransaction) => Promise<string>;
  signTransaction: (transaction: Transaction) => Promise<SignedTransaction>;
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
  serializeTransaction: (params: Transaction) => Promise<string>;
}
