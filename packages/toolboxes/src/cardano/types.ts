import type { GenericCreateTransactionParams, GenericTransferParams } from "@swapkit/helpers";

export interface CardanoProvider {
  isEnabled(): Promise<boolean>;
  enable(): Promise<Api>;
  getNetworkId(): Promise<number>;
  getUtxos(amount?: string, paginate?: Paginate): Promise<TransactionUnspentOutput[] | undefined>;
  getCollateral(params?: { amount: string }): Promise<TransactionUnspentOutput[] | undefined>;
  getBalance(): Promise<string>;
  getUsedAddresses(paginate?: Paginate): Promise<Address[]>;
  getUnusedAddresses(): Promise<Address[]>;
  getChangeAddress(): Promise<Address>;
  getRewardAddresses(): Promise<Address[]>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  signData(address: string, payload: string): Promise<DataSignature>;
  submitTx(tx: string): Promise<string>;
}

interface Api {
  getUtxos(amount?: string, paginate?: Paginate): Promise<TransactionUnspentOutput[] | undefined>;
  getCollateral(params?: { amount: string }): Promise<TransactionUnspentOutput[] | undefined>;
  getBalance(): Promise<string>;
  getUsedAddresses(paginate?: Paginate): Promise<Address[]>;
  getUnusedAddresses(): Promise<Address[]>;
  getChangeAddress(): Promise<Address>;
  getRewardAddresses(): Promise<Address[]>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  signData(address: string, payload: string): Promise<DataSignature>;
  submitTx(tx: string): Promise<string>;
  getNetworkId(): Promise<number>;
}

interface Paginate {
  page: number;
  limit: number;
}

interface DataSignature {
  signature: string;
  key: string;
}

interface TransactionUnspentOutput {
  input: TransactionInput;
  output: TransactionOutput;
}

interface TransactionInput {
  transaction_id: string;
  index: number;
}

interface TransactionOutput {
  address: string;
  amount: Value[];
  data_hash?: string;
  script_ref?: string;
}

interface Value {
  unit: string;
  quantity: string;
}

interface Address {
  address: string;
}

export type CardanoCreateTransactionParams = Omit<GenericCreateTransactionParams, "feeRate"> & {
  ttl?: number;
};

export type CardanoTransferParams = Omit<GenericTransferParams, "feeRate"> & {
  ttl?: number;
};

export interface CardanoKeypair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
  stakeAddress?: string;
}

export interface CardanoTransaction {
  body: string;
  witnessSet: string;
  auxiliaryData?: string;
}

export interface CardanoTxBuilder {
  add_input: (input: any) => void;
  add_output: (output: any) => void;
  set_fee: (fee: string) => void;
  set_ttl: (ttl?: number) => void;
  build: () => any;
}

export type CardanoNetwork = "mainnet" | "testnet" | "preview" | "preprod";
