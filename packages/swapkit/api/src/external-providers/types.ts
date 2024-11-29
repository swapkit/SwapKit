export type SwapkitApiBalanceResponse = {
  chain: string;
  decimal: number;
  ticker: string;
  symbol: string;
  value: string;
  identifier: string;
}[];

export type SwapkitApiRawTxResponse = string;

export type SwapkitApiScanUTXOResponse = ScanUTXO[];

export interface ScanUTXO {
  address: string;
  hash: string;
  index: number;
  value: number;
  witnessUtxo: WitnessUtxo;
}

export interface WitnessUtxo {
  value: number;
  script: number[];
}

export interface SwapkitApiAddressDataResponse {
  address: Address;
  transactions: string[];
  utxo: Utxo[];
}

export interface Address {
  type: string;
  script_hex: string;
  balance: number;
  balance_usd: number;
  received: number;
  received_usd: number;
  spent: number;
  spent_usd: number;
  output_count: number;
  unspent_output_count: number;
  first_seen_receiving: string;
  last_seen_receiving: string;
  first_seen_spending: string;
  last_seen_spending: string;
  transaction_count: number;
  scripthash_type: any;
}

export interface Utxo {
  block_id: number;
  transaction_hash: string;
  index: number;
  value: number;
}

export type SwapkitApiSuggestedTxFeeResponse = number;
