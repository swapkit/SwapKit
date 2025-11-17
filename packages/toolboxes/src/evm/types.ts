import type {
  AssetValue,
  ChainSigner,
  DerivationPathArray,
  FeeOption,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";
import { Chain } from "@swapkit/helpers";
import type {
  BigNumberish,
  BrowserProvider,
  JsonFragment,
  JsonRpcProvider,
  JsonRpcSigner,
  Signer,
  Transaction,
} from "ethers";
import type { getProvider } from "./index";
import type {
  ARBToolbox,
  AURORAToolbox,
  AVAXToolbox,
  BASEToolbox,
  BERAToolbox,
  BSCToolbox,
  COREToolbox,
  CORNToolbox,
  CROToolbox,
  ETHToolbox,
  GNOToolbox,
  HYPEREVMToolbox,
  MATICToolbox,
  MEGAETHToolbox,
  MONADToolbox,
  OPToolbox,
  SONICToolbox,
  UNIToolbox,
  XLayerToolbox,
} from "./toolbox";

export enum EthNetwork {
  Test = "goerli",
  Main = "homestead",
}

export type ApproveParams = {
  assetAddress: string;
  spenderAddress: string;
  feeOptionKey?: FeeOption;
  amount?: BigNumberish;
  from?: string;
  // Optional fallback in case estimation for gas limit fails
  gasLimitFallback?: BigNumberish;
  nonce?: number;
};

export type ApprovedParams = { assetAddress: string; spenderAddress: string; from: string };

export type IsApprovedParams = ApprovedParams & { amount?: BigNumberish };

export type CallParams = {
  callProvider?: Awaited<ReturnType<typeof getProvider>>;
  contractAddress: string;
  abi: readonly JsonFragment[];
  funcName: string;
  funcParams?: unknown[];
  txOverrides?: Partial<Transaction>;
  feeOption?: FeeOption;
};

export type EstimateCallParams = Pick<
  CallParams,
  "contractAddress" | "abi" | "funcName" | "funcParams" | "txOverrides"
>;

export type EVMTransferParams = GenericTransferParams & { sender?: string };

export type EVMCreateTransactionParams = Omit<GenericCreateTransactionParams, "feeRate"> & {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  data?: string;
  nonce?: number;
};

export type EVMMaxSendableAmountsParams = {
  from: string;
  assetValue: AssetValue;
  feeOptionKey?: FeeOption;
  memo?: string;
  abi?: readonly JsonFragment[];
  funcName?: string;
  contractAddress?: string;
  funcParams?: unknown[];
  txOverrides?: Partial<Transaction>;
};

export type EVMTxBaseParams<T = bigint> = {
  to?: string;
  from?: string;
  nonce?: number;
  gasLimit?: T;
  data?: string;
  value?: T;
  chainId?: T;
};

export type EIP1559TxParams<T = bigint> = EVMTxBaseParams<T> & {
  type?: number;
  maxFeePerGas?: T;
  maxPriorityFeePerGas?: T;
};

export type LegacyEVMTxParams<T = bigint> = EVMTxBaseParams<T> & { gasPrice?: T };

export type EVMTxParams = EIP1559TxParams | LegacyEVMTxParams;

export type EVMToolboxParams = { provider?: BrowserProvider | JsonRpcProvider } & (
  | { signer?: (ChainSigner<EVMTransferParams, string> & Signer) | JsonRpcSigner }
  | { phrase?: string; derivationPath?: DerivationPathArray; index?: number }
);

export type EVMToolboxes = {
  [Chain.Arbitrum]: Awaited<ReturnType<typeof ARBToolbox>>;
  [Chain.Aurora]: Awaited<ReturnType<typeof AURORAToolbox>>;
  [Chain.Avalanche]: Awaited<ReturnType<typeof AVAXToolbox>>;
  [Chain.Base]: Awaited<ReturnType<typeof BASEToolbox>>;
  [Chain.Berachain]: Awaited<ReturnType<typeof BERAToolbox>>;
  [Chain.BinanceSmartChain]: Awaited<ReturnType<typeof BSCToolbox>>;
  [Chain.Botanix]: Awaited<ReturnType<typeof SONICToolbox>>;
  [Chain.Core]: Awaited<ReturnType<typeof COREToolbox>>;
  [Chain.Corn]: Awaited<ReturnType<typeof CORNToolbox>>;
  [Chain.Cronos]: Awaited<ReturnType<typeof CROToolbox>>;
  [Chain.Ethereum]: Awaited<ReturnType<typeof ETHToolbox>>;
  [Chain.Gnosis]: Awaited<ReturnType<typeof GNOToolbox>>;
  [Chain.Hyperevm]: Awaited<ReturnType<typeof HYPEREVMToolbox>>;
  [Chain.MegaETH]: Awaited<ReturnType<typeof MEGAETHToolbox>>;
  [Chain.Monad]: Awaited<ReturnType<typeof MONADToolbox>>;
  [Chain.Optimism]: Awaited<ReturnType<typeof OPToolbox>>;
  [Chain.Polygon]: Awaited<ReturnType<typeof MATICToolbox>>;
  [Chain.Sonic]: Awaited<ReturnType<typeof SONICToolbox>>;
  [Chain.Unichain]: Awaited<ReturnType<typeof UNIToolbox>>;
  [Chain.XLayer]: Awaited<ReturnType<typeof XLayerToolbox>>;
};
