import type { OfflineAminoSigner } from "@cosmjs/amino";
import type { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing";
import type {
  ChainId,
  CosmosChain,
  DerivationPathArray,
  GenericCreateTransactionParams,
  TCLikeChain,
} from "@swapkit/helpers";
import type { buildAminoMsg } from "./thorchainUtils";
import type { createCosmosToolbox } from "./toolbox/cosmos";
import type { createThorchainToolbox } from "./toolbox/thorchain";
import type { getDefaultChainFee } from "./util";

export type CosmosSDKClientParams = { server: string; chainId: ChainId; prefix?: string; stagenet?: boolean };
export type CosmosCreateTransactionParams = GenericCreateTransactionParams & {
  accountNumber?: number;
  sequence?: number;
};

export type MultiSigSigner = { pubKey: string; signature: string };

export type MultisigTx = {
  msgs: ReturnType<typeof buildAminoMsg>[];
  accountNumber: number;
  sequence: number;
  chainId: ChainId;
  fee: ReturnType<typeof getDefaultChainFee>;
  memo: string;
};

export type CosmosSigner = DirectSecp256k1HdWallet | OfflineDirectSigner | OfflineAminoSigner;

export type CosmosToolboxParams<T = CosmosChain> = { chain: T } & (
  | { signer?: CosmosSigner }
  | { phrase?: string; derivationPath?: DerivationPathArray; index?: number }
);

export type BaseCosmosToolboxType = ReturnType<typeof createCosmosToolbox>;
export type BaseCosmosWallet = Awaited<ReturnType<typeof createCosmosToolbox>>;
export type CosmosWallets = {
  [chain in Exclude<CosmosChain, TCLikeChain>]: BaseCosmosWallet;
};

export type ThorchainWallet = Awaited<Omit<ReturnType<typeof createThorchainToolbox>, "signMessage">>;
export type ThorchainWallets = {
  [chain in TCLikeChain]: ThorchainWallet;
};
