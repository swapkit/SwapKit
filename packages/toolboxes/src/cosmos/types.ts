import type { OfflineAminoSigner, StdFee } from "@cosmjs/amino";
import type { OfflineDirectSigner } from "@cosmjs/proto-signing";
import type { AssetValue, ChainId, FeeOption } from "@swapkit/helpers";

import type {
  GaiaToolboxType,
  KujiraToolboxType,
  MayaToolboxType,
  ThorchainToolboxType,
} from "./index";

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
  privkey?: Uint8Array;
  recipient: string;
  signer?: OfflineDirectSigner | OfflineAminoSigner;
};

export type ToolboxParams = {
  rpcUrl?: string;
  prefix?: string;
};

export type Signer = {
  pubKey: string;
  signature: string;
};

export type CosmosLikeToolbox =
  | GaiaToolboxType
  | ThorchainToolboxType
  | MayaToolboxType
  | KujiraToolboxType;

export type CosmosMaxSendableAmountParams = {
  toolbox: CosmosLikeToolbox;
  from: string;
  asset?: AssetValue | string;
  feeOptionKey?: FeeOption;
};
