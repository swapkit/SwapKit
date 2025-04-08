import type { OfflineAminoSigner, StdFee } from "@cosmjs/amino";
import type { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing";
import type {
  AssetValue,
  Chain,
  ChainId,
  CosmosChain,
  DerivationPath,
  FeeOption,
} from "@swapkit/helpers";
import type { buildAminoMsg } from "./thorchainUtils";
import type { createCosmosToolbox } from "./toolbox/cosmos";
import type { createThorchainToolbox } from "./toolbox/thorchain";
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

export type CosmosToolboxParams = {
  signer?: CosmosSigner;
  derivationPath?: DerivationPath;
  index?: number;
  chain: CosmosChain;
};

export type BaseCosmosToolboxType = ReturnType<typeof createCosmosToolbox>;
export type BaseCosmosWallet = ReturnType<typeof createCosmosToolbox>;
export type CosmosWallets = {
  [chain in Chain.Cosmos | Chain.Kujira]: BaseCosmosWallet;
};

export type ThorchainWallet = Omit<ReturnType<typeof createThorchainToolbox>, "signMessage">;
export type ThorchainWallets = {
  [chain in Chain.THORChain | Chain.Maya]: ThorchainWallet;
};
