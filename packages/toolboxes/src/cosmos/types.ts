import type { OfflineAminoSigner, StdFee } from "@cosmjs/amino";
import type { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing";
import type { AssetValue, ChainId, FeeOption } from "@swapkit/helpers";
import type { buildAminoMsg } from "./thorchainUtils";
import type { getDefaultChainFee } from "./util";

export type CosmosSDKClientParams = {
  server: string;
  chainId: ChainId;
  prefix?: string;
  stagenet?: boolean;
};

export type TransferParams = {
  assetValue: AssetValue;
  fee?: StdFee | number;
  feeOptionKey?: FeeOption;
  from: string;
  memo?: string;
  recipient: string;
};

export type ToolboxParams = {
  rpcUrl?: string;
  prefix?: string;
};

export type MultiSigSigner = {
  pubKey: string;
  signature: string;
};

export type MultisigTx = {
  msgs: ReturnType<typeof buildAminoMsg>[];
  accountNumber: number;
  sequence: number;
  chainId: ChainId;
  fee: ReturnType<typeof getDefaultChainFee>;
  memo: string;
};

export type CosmosSigner = DirectSecp256k1HdWallet | OfflineDirectSigner | OfflineAminoSigner;
