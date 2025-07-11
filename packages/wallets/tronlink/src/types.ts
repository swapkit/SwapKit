import type { TronSignedTransaction, TronTransaction } from "@swapkit/toolbox-tron";

export interface TronLinkWindow {
  ready: boolean;
  request: (args: { method: string; params?: unknown }) => Promise<TronLinkResponse>;
  tronWeb: {
    defaultAddress: {
      base58: string;
      hex: string;
    };
    fullNode?: {
      host: string;
    };
    trx: {
      sign: (transaction: TronTransaction) => Promise<TronSignedTransaction>;
      sendRawTransaction: (signedTx: TronSignedTransaction) => Promise<string>;
      getBalance: (address: string) => Promise<number>;
      getAccountResources: (address: string) => Promise<unknown>;
    };
  };
  sunWeb?: unknown; // For sidechain support
}

export enum TronLinkResponseCode {
  SUCCESS = 200,
  CANCELED = 4000,
  REJECTED = 4001,
}

export interface TronLinkResponse {
  code: TronLinkResponseCode;
  message: string;
}

export interface TronLinkEvents {
  setAccount: {
    address: string;
  };
  setNode: {
    node: {
      chain: string;
      fullNode: string;
    };
  };
}
