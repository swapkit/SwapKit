import type { CovalentApiType, EthplorerApiType } from "@swapkit/toolbox-evm";
import type { BlockchairApiType } from "@swapkit/toolbox-utxo";

import type { AlchemyApiType } from "@swapkit/toolbox-evm/src/api/alchemyApi";
import type { AssetValue } from "../modules/assetValue";
import type { Chain, CosmosChain, UTXOChain } from "./chains";

type NonEthEvmChains =
  | Chain.Base
  | Chain.BinanceSmartChain
  | Chain.Polygon
  | Chain.Avalanche
  | Chain.Arbitrum
  | Chain.Optimism;

export type ChainApis = { [key in NonEthEvmChains]?: CovalentApiType | AlchemyApiType } & {
  [key in Chain.Ethereum]?: EthplorerApiType;
} & {
  [key in UTXOChain]?: BlockchairApiType;
} & {
  [key in CosmosChain | Chain.Solana | Chain.Radix | Chain.Polkadot | Chain.Chainflip]?: string;
} & {
  [key in Chain.Fiat]?: undefined;
};

export type ChainApi =
  | EthplorerApiType
  | CovalentApiType
  | AlchemyApiType
  | BlockchairApiType
  | string;

export type GenericSwapParams<T = unknown> = {
  buyAsset?: AssetValue;
  sellAsset?: AssetValue;
  recipient?: string;
  feeOptionKey?: FeeOption;
  route: T;
};

export type SwapParams<PluginNames = string, R = unknown> = GenericSwapParams<R> & {
  pluginName?: PluginNames;
};

export enum FeeOption {
  Average = "average",
  Fast = "fast",
  Fastest = "fastest",
}

export enum ApproveMode {
  Approve = "approve",
  CheckOnly = "checkOnly",
}

export type ApproveReturnType<T extends ApproveMode> = T extends "checkOnly"
  ? Promise<boolean>
  : Promise<string>;

export type WalletTxParams = {
  feeOptionKey?: FeeOption;
  from?: string;
  memo?: string; // optional memo to pass
  recipient: string;
};

export enum MemoType {
  NAME_REGISTER = "~",
  BOND = "BOND",
  DEPOSIT = "+",
  LEAVE = "LEAVE",
  UNBOND = "UNBOND",
  WITHDRAW = "-",
  OPEN_LOAN = "$+",
  CLOSE_LOAN = "$-",
  RUNEPOOL_DEPOSIT = "POOL+",
  RUNEPOOL_WITHDRAW = "POOL-",
}
