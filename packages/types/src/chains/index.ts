import { Chain, ChainId, StagenetChain } from "./_enums";
import { CosmosChainConfigs } from "./cosmos";
import { EVMChainConfigs } from "./evm";
import { OtherChainConfigs } from "./others";
import { SubstrateChainConfigs } from "./substrate";
import { UTXOChainConfigs } from "./utxo";

export * from "./_enums";
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

export const AllChains = Object.values(Chain);
export const StagenetChains = [StagenetChain.THORChain, StagenetChain.Maya] as const;

type ChainConfigMap = {
  [K in ChainConfig["chain"]]: Extract<ChainConfig, { chain: K }>;
} & {
  [K in ChainConfig["chainId"]]: Extract<ChainConfig, { chainId: K }>;
};

const chainConfigs = AllChainConfigs.reduce(
  (acc, config) => {
    acc[config.chain] = config;
    acc[config.chainId] = config;
    return acc;
  },
  {} as Record<ChainConfig["chain"] | ChainConfig["chainId"], ChainConfig>,
);

export function getChainConfig<T extends keyof ChainConfigMap>(chainOrChainId: T): ChainConfigMap[T] {
  const chainConfig = chainConfigs[chainOrChainId];

  return (chainConfig || {}) as ChainConfigMap[T];
}

const { chainIdToChain, chainToBaseDecimal, chainToBlockTime } = AllChains.reduce(
  (acc, chain) => {
    const { chainId, baseDecimal, blockTime } = getChainConfig(chain);

    acc.chainIdToChain[chainId] = chain;
    acc.chainToBaseDecimal[chain] = baseDecimal;
    acc.chainToBlockTime[chain] = blockTime;
    return acc;
  },
  {} as {
    chainIdToChain: Record<ChainId, Chain>;
    chainToBaseDecimal: Record<Chain, number>;
    chainToBlockTime: Record<Chain, number>;
  },
);

/**
 *
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const chainId = ChainToChainId[Chain.Ethereum];
 * +const { chainId } = getChainConfig(Chain.Ethereum);
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
export const ChainIdToChain = chainIdToChain;

/**
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const baseDecimal = BaseDecimal[Chain.Ethereum];
 * +const { baseDecimal } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BaseDecimal = chainToBaseDecimal;

/**
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const blockTime = BlockTimes[Chain.Ethereum];
 * +const { blockTime } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BlockTimes = chainToBlockTime;
