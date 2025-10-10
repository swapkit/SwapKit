import type {
  AssetValue,
  ChainSigner,
  DerivationPathArray,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";
import type { Account, Contract, KeyPairSigner, providers, Signer, transactions } from "near-api-js";
import type { Action, SignedTransaction, Transaction } from "near-api-js/lib/transaction";
import type { NEP141Token } from "../helpers/nep141";
import type { NearContractInterface, NearGasEstimateParams } from "../types/contract";

interface NearKeyPairSigner
  extends KeyPairSigner,
    Omit<ChainSigner<typeof transactions.Transaction, typeof transactions.SignedTransaction>, "signTransaction"> {}

interface NearGeneralSigner
  extends Signer,
    Omit<ChainSigner<typeof transactions.Transaction, typeof transactions.SignedTransaction>, "signTransaction"> {}

export type NearSigner = NearKeyPairSigner | NearGeneralSigner;

export type NearToolboxParams =
  | { signer?: NearSigner; accountId?: string }
  | { phrase?: string; index?: number; derivationPath?: DerivationPathArray };

export interface NearTransferParams extends GenericTransferParams {}

export interface NearConfig {
  networkId: "mainnet" | "testnet" | "betanet";
  nodeUrl: string;
  walletUrl?: string;
  helperUrl?: string;
  keyStore?: any;
}

export interface NearFunctionCallParams {
  contractId: string;
  methodName: string;
  args: Uint8Array | Record<string, any>;
  deposit?: bigint | string | number;
  gas?: bigint | string | number;
}

export interface NearCreateTransactionParams extends Omit<GenericCreateTransactionParams, "feeRate"> {
  attachedDeposit?: string;
  functionCall?: { methodName: string; args: object; attachedDeposit: string; gas: string; contractId: string };
}

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
  signAndBroadcastTransaction: (transaction: Transaction) => Promise<string>;
  signer: NearSigner | undefined;
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
