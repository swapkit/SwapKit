import type { EncodeObject } from "@cosmjs/proto-signing";
import type {
  Asset,
  ChainId,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";

enum TxType {
  Transfer = "transfer",
  Unknown = "unknown",
}

type Tx = {
  asset: Asset; // asset
  from: { from: string }[]; // list of "from" txs. BNC will have one `TxFrom` only, `BTC` might have many transactions going "in" (based on UTXO)
  to: { to: string }[]; // list of "to" transactions. BNC will have one `TxTo` only, `BTC` might have many transactions going "out" (based on UTXO)
  date: Date; // timestamp of tx
  type: TxType; // type
  hash: string; // Tx hash
};

export type NodeUrl = {
  node: string;
  rpc: string;
};

export type TxData = Pick<Tx, "from" | "to" | "type">;

/**
 * Response from `thorchain/constants` endpoint
 */
export type ThorchainConstantsResponse = {
  int_64_values: {
    // We are in fee interested only - ignore all other values
    NativeTransactionFee: number;
  };
};

/**
 * Response of `/cosmos/base/tendermint/v1beta1/node_info`
 * Note: We are interested in `network` (aka chain id) only
 */
export type NodeInfoResponse = {
  default_node_info: {
    network: string;
  };
};

export type TransferTransaction = {
  memo: string;
  accountNumber: number;
  sequence: number;
  chainId: ChainId;
  msgs: EncodeObject[];
  fee: { amount: { denom: string; amount: string }[]; gas: string };
};

export type CosmosCreateTransactionParams = GenericCreateTransactionParams & {
  accountNumber?: number;
  sequence?: number;
};

export type ThorchainCreateTransactionParams = Omit<CosmosCreateTransactionParams, "feeRate"> & {
  asSignable?: boolean;
  asAminoMessage?: boolean;
};

export type ThorchainCreateDepositTransactionParams = Omit<
  ThorchainCreateTransactionParams,
  "recipient"
>;

export type ThorchainDepositParams = Omit<GenericTransferParams, "recipient">;
