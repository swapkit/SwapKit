import { mapChains } from "./_createChain";
import { CosmosChainConfigs, StagenetCosmosChainConfigs } from "./cosmos";
import { EVMChainConfigs } from "./evm";
import { OtherChainConfigs } from "./others";
import { SubstrateChainConfigs } from "./substrate";
import { UTXOChainConfigs } from "./utxo";

export * from "./cosmos";
export * from "./evm";
export * from "./others";
export * from "./substrate";
export * from "./utxo";

export const AllChainConfigs = [
  ...UTXOChainConfigs,
  ...EVMChainConfigs,
  ...CosmosChainConfigs,
  ...SubstrateChainConfigs,
  ...OtherChainConfigs,
].sort((a, b) => a.chain.localeCompare(b.chain));
export type AllChainConfigs = typeof AllChainConfigs;
export const AllChains = mapChains(AllChainConfigs);

export const StagenetChainConfigs = [...StagenetCosmosChainConfigs].sort((a, b) => a.chain.localeCompare(b.chain));
export type StagenetChainConfigs = typeof StagenetChainConfigs;
export const StagenetChains = mapChains(StagenetChainConfigs);

export const Chain = Object.fromEntries(AllChainConfigs.map(({ name, chain }) => [name, chain] as const)) as {
  readonly [K in AllChainConfigs[number]["name"]]: Extract<AllChainConfigs[number], { name: K }>["chain"];
};

export type Chain = AllChainConfigs[number]["chain"];
export const ChainId = Object.fromEntries(AllChainConfigs.map(({ chainId, chain }) => [chain, chainId] as const)) as {
  readonly [K in AllChainConfigs[number]["chain"]]: Extract<AllChainConfigs[number], { chain: K }>["chainId"];
};
export type ChainId = AllChainConfigs[number]["chainId"];

export const StagenetChain = Object.fromEntries(
  StagenetChainConfigs.map(({ name, chain }) => [name, `${chain}_STAGENET`]),
) as {
  readonly [K in StagenetChainConfigs[number]["name"]]: `${StagenetChainConfigs[number]["chain"]}_STAGENET`;
};
export type StagenetChain = StagenetChainConfigs[number]["chain"];

type ChainConfigMap = {
  [K in AllChainConfigs[number]["chain"]]: Extract<AllChainConfigs[number], { chain: K }>;
};

const chainConfigMap = new Map<AllChainConfigs[number]["chain"], AllChainConfigs[number]>(
  AllChainConfigs.map((config) => [config.chain, config]),
);

export function getChainConfig<T extends AllChainConfigs[number]["chain"]>(chain: T): ChainConfigMap[T] {
  const chainConfig = chainConfigMap.get(chain);

  return (chainConfig || {}) as ChainConfigMap[T];
}
