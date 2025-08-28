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
export type ChainConfig = AllChainConfigs[number];

export const AllChains = mapChains(AllChainConfigs);
export type AllChains = typeof AllChains;

export const AllStagenetChainConfigs = [...StagenetCosmosChainConfigs];
export type AllStagenetChainConfigs = typeof AllStagenetChainConfigs;
export type StagenetChainConfigs = AllStagenetChainConfigs[number];
export const StagenetChains = mapChains(AllStagenetChainConfigs);
export type StagenetChains = typeof StagenetChains;

const chainAndNameToChain = AllChainConfigs.flatMap(({ chain, name }) => [
  //   [chain, chain] as const,
  [name, chain] as const,
]);
export const Chain = Object.fromEntries(chainAndNameToChain) as {
  readonly [K in ChainConfig["name"]]: Extract<ChainConfig, { chain: K } | { name: K }>["chain"];
};
export type Chain = (typeof Chain)[ChainConfig["name"]];

const chainAndNameToChainId = AllChainConfigs.flatMap(({ chainId, chain, name }) => [
  [chain, chainId] as const,
  [name, chainId] as const,
]);
export const ChainId = Object.fromEntries(chainAndNameToChainId) as {
  readonly [K in ChainConfig["name"] | ChainConfig["chain"]]: Extract<
    ChainConfig,
    { chain: K } | { name: K }
  >["chainId"];
};
export type ChainId = (typeof ChainId)[ChainConfig["name"]];

const stagenetChainsToStagenetChain = AllStagenetChainConfigs.flatMap(({ name, chain }) => [[name, chain] as const]);
export const StagenetChain = Object.fromEntries(stagenetChainsToStagenetChain) as {
  readonly [K in StagenetChainConfigs["name"]]: Extract<StagenetChainConfigs, { chain: K } | { name: K }>["chain"];
};
export type StagenetChain = (typeof StagenetChain)[StagenetChainConfigs["name"]];

type ChainConfigMap = {
  [K in ChainConfig["chain"]]: Extract<ChainConfig, { chain: K }>;
};

const chainConfigMap = new Map<ChainConfig["chain"], ChainConfig>(
  AllChainConfigs.map((config) => [config.chain, config]),
);

export function getChainConfig<T extends Chain>(chain: T): ChainConfigMap[T] {
  const chainConfig = chainConfigMap.get(chain);

  return (chainConfig || {}) as ChainConfigMap[T];
}

/**
 * @deprecated use ChainId instead
 * @example
 * ```diff
 * -const chainId = ChainToChainId[Chain.Ethereum];
 * +const chainId = ChainId[Chain.Ethereum];
 * ```
 */
export const ChainToChainId = ChainId;

/**
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const chain = ChainIdToChain[ChainId.Ethereum];
 * +const { chain } = getChainConfig(ChainId.Ethereum);
 * ```
 */
export const ChainIdToChain = Object.fromEntries(
  AllChainConfigs.flatMap(({ chainId, chain }) => [[chainId, chain] as const]),
) as {
  readonly [K in ChainConfig["chainId"]]: Extract<ChainConfig, { chainId: K }>["chain"];
};

/**
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const baseDecimal = BaseDecimal[Chain.Ethereum];
 * +const { baseDecimal } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BaseDecimal = Object.fromEntries(
  AllChainConfigs.flatMap(({ baseDecimal, chain }) => [[chain, baseDecimal] as const]),
) as {
  readonly [K in ChainConfig["chain"]]: Extract<ChainConfig, { chain: K }>["baseDecimal"];
};
