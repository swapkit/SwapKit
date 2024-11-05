import { EXPLORER_URLS, getRPCUrl } from "./network";

export enum Chain {
  Arbitrum = "ARB",
  Avalanche = "AVAX",
  Base = "BASE",
  BinanceSmartChain = "BSC",
  Bitcoin = "BTC",
  BitcoinCash = "BCH",
  Cosmos = "GAIA",
  Dash = "DASH",
  Dogecoin = "DOGE",
  Ethereum = "ETH",
  Kujira = "KUJI",
  Litecoin = "LTC",
  Maya = "MAYA",
  Optimism = "OP",
  Polkadot = "DOT",
  Chainflip = "FLIP",
  Polygon = "MATIC",
  Radix = "XRD",
  THORChain = "THOR",
  Solana = "SOL",
}

export enum StagenetChain {
  THORChain = "THOR_STAGENET",
  Maya = "MAYA_STAGENET",
}

export type WalletChain = Exclude<Chain, Chain.Radix>;

export enum ChainId {
  Arbitrum = "42161",
  ArbitrumHex = "0xa4b1",
  Avalanche = "43114",
  AvalancheHex = "0xa86a",
  Base = "8453",
  BaseHex = "0x2105",
  BinanceSmartChain = "56",
  BinanceSmartChainHex = "0x38",
  Bitcoin = "bitcoin",
  BitcoinCash = "bitcoincash",
  Chainflip = "chainflip",
  Cosmos = "cosmoshub-4",
  Dash = "dash",
  Dogecoin = "dogecoin",
  Kujira = "kaiyo-1",
  Ethereum = "1",
  EthereumHex = "0x1",
  Litecoin = "litecoin",
  Maya = "mayachain-mainnet-v1",
  MayaStagenet = "mayachain-stagenet-v1",
  Optimism = "10",
  OptimismHex = "0xa",
  Polkadot = "polkadot",
  Polygon = "137",
  PolygonHex = "0x89",
  Radix = "radix-mainnet",
  THORChain = "thorchain-1",
  THORChainStagenet = "thorchain-stagenet-v2",
  Solana = "solana",
}

export const ChainIdToChain: Record<ChainId, Chain> = {
  [ChainId.ArbitrumHex]: Chain.Arbitrum,
  [ChainId.Arbitrum]: Chain.Arbitrum,
  [ChainId.AvalancheHex]: Chain.Avalanche,
  [ChainId.Avalanche]: Chain.Avalanche,
  [ChainId.BaseHex]: Chain.Base,
  [ChainId.Base]: Chain.Base,
  [ChainId.BinanceSmartChainHex]: Chain.BinanceSmartChain,
  [ChainId.BinanceSmartChain]: Chain.BinanceSmartChain,
  [ChainId.BitcoinCash]: Chain.BitcoinCash,
  [ChainId.Bitcoin]: Chain.Bitcoin,
  [ChainId.Chainflip]: Chain.Chainflip,
  [ChainId.Cosmos]: Chain.Cosmos,
  [ChainId.Dash]: Chain.Dash,
  [ChainId.Dogecoin]: Chain.Dogecoin,
  [ChainId.EthereumHex]: Chain.Ethereum,
  [ChainId.Kujira]: Chain.Kujira,
  [ChainId.Ethereum]: Chain.Ethereum,
  [ChainId.Litecoin]: Chain.Litecoin,
  [ChainId.MayaStagenet]: Chain.Maya,
  [ChainId.Maya]: Chain.Maya,
  [ChainId.OptimismHex]: Chain.Optimism,
  [ChainId.Optimism]: Chain.Optimism,
  [ChainId.Polkadot]: Chain.Polkadot,
  [ChainId.PolygonHex]: Chain.Polygon,
  [ChainId.Polygon]: Chain.Polygon,
  [ChainId.Radix]: Chain.Radix,
  [ChainId.THORChainStagenet]: Chain.THORChain,
  [ChainId.THORChain]: Chain.THORChain,
  [ChainId.Solana]: Chain.Solana,
};

type ChainNameType = keyof typeof Chain;
const chainNames = Object.keys(Chain) as ChainNameType[];
const chains = Object.values(Chain) as Chain[];

export const BaseDecimal: Record<Chain, number> = {
  ARB: 18,
  AVAX: 18,
  BASE: 18,
  BCH: 8,
  BSC: 18,
  BTC: 8,
  DASH: 8,
  DOGE: 8,
  DOT: 10,
  ETH: 18,
  FLIP: 18,
  GAIA: 6,
  KUJI: 6,
  LTC: 8,
  MATIC: 18,
  MAYA: 8,
  OP: 18,
  SOL: 9,
  THOR: 8,
  XRD: 18,
};

export type SubstrateChain = Chain.Polkadot | Chain.Chainflip;
export const SubstrateChains = [Chain.Polkadot, Chain.Chainflip];

export type EVMChain =
  | Chain.Arbitrum
  | Chain.Avalanche
  | Chain.Base
  | Chain.BinanceSmartChain
  | Chain.Ethereum
  | Chain.Optimism
  | Chain.Polygon;
export const EVMChains = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Ethereum,
  Chain.Optimism,
  Chain.Polygon,
] as const;

export type UTXOChain =
  | Chain.Bitcoin
  | Chain.BitcoinCash
  | Chain.Dash
  | Chain.Dogecoin
  | Chain.Litecoin;
export const UTXOChains = [
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
] as const;

export type CosmosChain = Chain.Cosmos | Chain.THORChain | Chain.Maya | Chain.Kujira;
export const CosmosChains = [Chain.Cosmos, Chain.THORChain, Chain.Maya, Chain.Kujira] as const;

export const TCSupportedChains = [
  Chain.Avalanche,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.THORChain,
] as const;

export const MAYASupportedChains = [
  Chain.Arbitrum,
  Chain.Dash,
  Chain.Ethereum,
  Chain.Kujira,
  Chain.Maya,
  Chain.THORChain,
] as const;

const ChainToChainName = chains.reduce(
  (acc, chain) => {
    const chainName = chainNames.find((key) => Chain[key as ChainNameType] === chain);

    if (chainName) acc[chain] = chainName;

    return acc;
  },
  {} as { [key in Chain]: ChainNameType },
);

export const ChainToChainId = chains.reduce(
  (acc, chain) => {
    acc[chain] = ChainId[ChainToChainName[chain]];
    return acc;
  },
  {} as { [key in Chain]: ChainId },
);

export const ChainToRPC = chains.reduce(
  (acc, chain) => {
    acc[chain] = getRPCUrl(chain);
    return acc;
  },
  {} as { [key in Chain]: string },
);

export const ChainToHexChainId = chains.reduce(
  (acc, chain) => {
    const chainString = `${ChainToChainName[chain]}Hex` as keyof typeof ChainId;

    acc[chain] = ChainId[chainString];
    return acc;
  },
  {} as { [key in Chain]: ChainId },
);

export const ChainToExplorerUrl = chains.reduce(
  (acc, chain) => {
    acc[chain] = EXPLORER_URLS[chain];
    return acc;
  },
  {} as { [key in Chain]: string },
);
