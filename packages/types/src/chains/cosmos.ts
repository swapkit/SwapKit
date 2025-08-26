import { createChain, mapChains } from "./_createChain";

const type = "cosmos";

export const GAIAConfig = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://www.mintscan.io/cosmos",
  chain: "GAIA",
  chainId: "cosmoshub-4",
  explorerUrl: "https://www.mintscan.io/cosmos",
  name: "Cosmos",
  nativeCurrency: "ATOM",
  rpcUrl: "https://cosmos-rpc.publicnode.com:443",
  type,
});

export const THORConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://runescan.io",
  chain: "THOR",
  chainId: "thorchain-1",
  explorerUrl: "https://runescan.io",
  name: "THORChain",
  nativeCurrency: "RUNE",
  rpcUrl: "https://rpc.thorswap.net",
  type,
});

export const StagenetTHORConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://runescan.io",
  chain: "THOR",
  chainId: "thorchain-stagenet-v2",
  explorerUrl: "https://runescan.io",
  name: "THORChain",
  nativeCurrency: "RUNE",
  rpcUrl: "https://rpc.thorswap.net",
  type,
});

export const MAYAConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.mayascan.org",
  chain: "MAYA",
  chainId: "mayachain-mainnet-v1",
  explorerUrl: "https://www.mayascan.org",
  name: "Maya",
  nativeCurrency: "CACAO",
  rpcUrl: "https://tendermint.mayachain.info",
  type,
});

export const StagenetMAYAConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.mayascan.org",
  chain: "MAYA",
  chainId: "mayachain-stagenet-v1",
  explorerUrl: "https://www.mayascan.org",
  name: "Maya",
  nativeCurrency: "CACAO",
  rpcUrl: "https://tendermint.mayachain.info",
  type,
});

export const KUJIConfig = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://finder.kujira.network/kaiyo-1",
  chain: "KUJI",
  chainId: "kaiyo-1",
  explorerUrl: "https://finder.kujira.network/kaiyo-1",
  name: "Kujira",
  nativeCurrency: "KUJI",
  rpcUrl: "https://kujira-rpc.ibs.team",
  type,
});

export const NOBLEConfig = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://www.mintscan.io/noble",
  chain: "NOBLE",
  chainId: "noble-1",
  explorerUrl: "https://www.mintscan.io/noble",
  name: "Noble",
  nativeCurrency: "USDC",
  rpcUrl: "https://noble-rpc.polkachu.com",
  type,
});

export const CosmosChainConfigs = [GAIAConfig, THORConfig, MAYAConfig, KUJIConfig, NOBLEConfig] as const;
export const CosmosChains = mapChains(CosmosChainConfigs);
export type CosmosChain = (typeof CosmosChains)[number];

export const StagenetCosmosChainConfigs = [StagenetTHORConfig, StagenetMAYAConfig] as const;
export const StagenetCosmosChains = mapChains(StagenetCosmosChainConfigs);
export type StagenetCosmosChain = (typeof StagenetCosmosChains)[number];

export const CosmosChainPrefixes: Record<CosmosChain, string> = {
  [GAIAConfig.chain]: "cosmos",
  [THORConfig.chain]: "thor",
  [MAYAConfig.chain]: "maya",
  [KUJIConfig.chain]: "kujira",
  [NOBLEConfig.chain]: "noble",
};

export const TCLikeChains = [
  THORConfig.chain,
  MAYAConfig.chain,
  StagenetTHORConfig.chain,
  StagenetMAYAConfig.chain,
] as const;
export type TCLikeChain = (typeof TCLikeChains)[number];
