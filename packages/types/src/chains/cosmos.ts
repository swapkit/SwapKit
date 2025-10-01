import { createChain } from "./_createChain";
import { Chain, ChainId, StagenetChain } from "./_enums";

const type = "cosmos";

export const GAIAConfig = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://www.mintscan.io/cosmos",
  blockTime: 2,
  chain: Chain.Cosmos,
  chainId: ChainId.Cosmos,
  explorerUrl: "https://www.mintscan.io/cosmos",
  name: "Cosmos",
  nativeCurrency: "ATOM",
  rpcUrl: "https://cosmos-rpc.publicnode.com:443",
  type,
});

export const THORConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://runescan.io",
  blockTime: 6,
  chain: Chain.THORChain,
  chainId: ChainId.THORChain,
  explorerUrl: "https://runescan.io",
  name: "THORChain",
  nativeCurrency: "RUNE",
  rpcUrl: "https://rpc.thorswap.net",
  type,
});

export const StagenetTHORConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://runescan.io",
  blockTime: 6,
  chain: StagenetChain.THORChain,
  chainId: ChainId.THORChainStagenet,
  explorerUrl: "https://runescan.io",
  name: "THORChain",
  nativeCurrency: "RUNE",
  rpcUrl: "https://rpc.thorswap.net",
  type,
});

export const MAYAConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.mayascan.org",
  blockTime: 6,
  chain: Chain.Maya,
  chainId: ChainId.Maya,
  explorerUrl: "https://www.mayascan.org",
  name: "Maya",
  nativeCurrency: "CACAO",
  rpcUrl: "https://tendermint.mayachain.info",
  type,
});

export const HARBORConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "",
  blockTime: 6,
  chain: Chain.Harbor,
  chainId: ChainId.Harbor,
  explorerUrl: "",
  name: "Harbor",
  nativeCurrency: "HRB",
  rpcUrl: "https://xnode.harbor-dev.xyz/xnode",
  type,
});

export const StagenetHARBORConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "",
  blockTime: 6,
  chain: StagenetChain.Harbor,
  chainId: ChainId.HarborStagenet,
  explorerUrl: "",
  name: "Harbor",
  nativeCurrency: "HRB",
  rpcUrl: "https://xnode.harbor-dev.xyz/xnode",
  type,
});

export const StagenetMAYAConfig = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.mayascan.org",
  blockTime: 6,
  chain: StagenetChain.Maya,
  chainId: ChainId.MayaStagenet,
  explorerUrl: "https://www.mayascan.org",
  name: "Maya",
  nativeCurrency: "CACAO",
  rpcUrl: "https://tendermint.mayachain.info",
  type,
});

export const KUJIConfig = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://finder.kujira.network/kaiyo-1",
  blockTime: 2.2,
  chain: Chain.Kujira,
  chainId: ChainId.Kujira,
  explorerUrl: "https://finder.kujira.network/kaiyo-1",
  name: "Kujira",
  nativeCurrency: "KUJI",
  rpcUrl: "https://kujira-rpc.ibs.team",
  type,
});

export const NOBLEConfig = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://www.mintscan.io/noble",
  blockTime: 1.3,
  chain: Chain.Noble,
  chainId: ChainId.Noble,
  explorerUrl: "https://www.mintscan.io/noble",
  name: "Noble",
  nativeCurrency: "USDC",
  rpcUrl: "https://noble-rpc.polkachu.com",
  type,
});

export const CosmosChainConfigs = [GAIAConfig, THORConfig, MAYAConfig, KUJIConfig, NOBLEConfig, HARBORConfig] as const;
export const CosmosChains = [
  Chain.Cosmos,
  Chain.Kujira,
  Chain.Maya,
  Chain.Noble,
  Chain.THORChain,
  Chain.Harbor,
] as const;
export type CosmosChain = (typeof CosmosChains)[number];

export const StagenetCosmosChainConfigs = [StagenetTHORConfig, StagenetMAYAConfig, StagenetHARBORConfig] as const;
export const StagenetCosmosChains = [StagenetChain.Maya, StagenetChain.THORChain, StagenetChain.Harbor] as const;
export type StagenetCosmosChain = (typeof StagenetCosmosChains)[number];

export const CosmosChainPrefixes: Record<CosmosChain, string> = {
  [GAIAConfig.chain]: "cosmos",
  [THORConfig.chain]: "thor",
  [MAYAConfig.chain]: "maya",
  [KUJIConfig.chain]: "kujira",
  [NOBLEConfig.chain]: "noble",
  [HARBORConfig.chain]: "harbor",
};

export const TCLikeChains = [THORConfig.chain, MAYAConfig.chain] as const;
export type TCLikeChain = (typeof TCLikeChains)[number];
