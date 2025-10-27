import { createChain } from "./_createChain";
import { Chain, ChainId, StagenetChain } from "./_enums";

const type = "cosmos";

export const GAIAConfig = createChain({
  baseDecimal: 6,
  blockTime: 2,
  chain: Chain.Cosmos,
  chainId: ChainId.Cosmos,
  explorerUrl: "https://www.mintscan.io/cosmos",
  name: "Cosmos",
  nativeCurrency: "ATOM",
  networkDerivationPath: [44, 118, 0, 0, 0],
  rpcUrls: ["https://cosmos-rpc.publicnode.com:443", "https://cosmos-rpc.publicnode.com"],
  type,
});

export const THORConfig = createChain({
  baseDecimal: 8,
  blockTime: 6,
  chain: Chain.THORChain,
  chainId: ChainId.THORChain,
  explorerUrl: "https://runescan.io",
  name: "THORChain",
  nativeCurrency: "RUNE",
  networkDerivationPath: [44, 931, 0, 0, 0],
  nodeUrl: "https://thornode.ninerealms.com",
  rpcUrls: ["https://rpc.ninerealms.com", "https://thornode.ninerealms.com"],
  type,
});

export const StagenetTHORConfig = createChain({
  baseDecimal: 8,
  blockTime: 6,
  chain: StagenetChain.THORChain,
  chainId: ChainId.THORChainStagenet,
  explorerUrl: "https://runescan.io",
  name: "THORChain",
  nativeCurrency: "RUNE",
  networkDerivationPath: [44, 931, 0, 0, 0],
  nodeUrl: "https://stagenet-thornode.ninerealms.com",
  rpcUrls: ["https://stagenet-rpc.ninerealms.com", "https://stagenet-thornode.ninerealms.com"],
  type,
});

export const MAYAConfig = createChain({
  baseDecimal: 8,
  blockTime: 6,
  chain: Chain.Maya,
  chainId: ChainId.Maya,
  explorerUrl: "https://www.mayascan.org",
  name: "Maya",
  nativeCurrency: "CACAO",
  networkDerivationPath: [44, 931, 0, 0, 0],
  nodeUrl: "https://mayanode.mayachain.info",
  rpcUrls: [
    "https://tendermint.mayachain.info",
    "https://maya-tendermint.publicnode.com",
    "https://mayanode.mayachain.info",
  ],
  type,
});

export const HARBORConfig = createChain({
  baseDecimal: 8,
  blockTime: 6,
  chain: Chain.Harbor,
  chainId: ChainId.Harbor,
  explorerUrl: "",
  name: "Harbor",
  nativeCurrency: "HRB",
  networkDerivationPath: [44, 931, 0, 0, 0],
  rpcUrls: ["https://xnode.harbor-dev.xyz/xnode"],
  type,
});

export const StagenetHARBORConfig = createChain({
  baseDecimal: 8,
  blockTime: 6,
  chain: StagenetChain.Harbor,
  chainId: ChainId.HarborStagenet,
  explorerUrl: "",
  name: "Harbor",
  nativeCurrency: "HRB",
  networkDerivationPath: [44, 931, 0, 0, 0],
  rpcUrls: ["https://xnode.harbor-dev.xyz/xnode"],
  type,
});

export const StagenetMAYAConfig = createChain({
  baseDecimal: 8,
  blockTime: 6,
  chain: StagenetChain.Maya,
  chainId: ChainId.MayaStagenet,
  explorerUrl: "https://www.mayascan.org",
  name: "Maya",
  nativeCurrency: "CACAO",
  networkDerivationPath: [44, 931, 0, 0, 0],
  nodeUrl: "https://stagenet.mayanode.mayachain.info",
  rpcUrls: ["https://stagenet.mayanode.mayachain.info"],
  type,
});

export const KUJIConfig = createChain({
  baseDecimal: 6,
  blockTime: 2.2,
  chain: Chain.Kujira,
  chainId: ChainId.Kujira,
  explorerUrl: "https://finder.kujira.network/kaiyo-1",
  name: "Kujira",
  nativeCurrency: "KUJI",
  networkDerivationPath: [44, 118, 0, 0, 0],
  rpcUrls: ["https://kujira-rpc.ibs.team", "https://kujira-rpc.polkachu.com", "https://rpc-kujira.synergynodes.com/"],
  type,
});

export const NOBLEConfig = createChain({
  baseDecimal: 6,
  blockTime: 1.3,
  chain: Chain.Noble,
  chainId: ChainId.Noble,
  explorerUrl: "https://www.mintscan.io/noble",
  name: "Noble",
  nativeCurrency: "USDC",
  networkDerivationPath: [44, 118, 0, 0, 0],
  rpcUrls: ["https://noble-rpc.polkachu.com", "https://rpc.noble.xyz", "https://rpc.cosmos.directory/noble"],
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

export const CosmosChainPrefixes: Record<CosmosChain | StagenetCosmosChain, string> = {
  [GAIAConfig.chain]: "cosmos",
  [THORConfig.chain]: "thor",
  [StagenetTHORConfig.chain]: "sthor",
  [MAYAConfig.chain]: "maya",
  [StagenetMAYAConfig.chain]: "smaya",
  [KUJIConfig.chain]: "kujira",
  [NOBLEConfig.chain]: "noble",
  [HARBORConfig.chain]: "harbor",
  [StagenetHARBORConfig.chain]: "sharbor",
};

export const TCLikeChains = [THORConfig.chain, MAYAConfig.chain] as const;
export type TCLikeChain = (typeof TCLikeChains)[number];
