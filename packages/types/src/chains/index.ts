import { Chain, type ChainId, StagenetChain } from "./_enums";
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

/**
 * Note: ChainToChainId will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const chainId = ChainToChainId[Chain.Ethereum];
 * +const { chainId } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const ChainToChainId = Object.fromEntries(
  AllChainConfigs.flatMap(({ chain, chainId }) => [[chain, chainId] as const]),
) as {
  readonly [K in Chain]: Extract<ChainConfig, { chain: K }>["chainId"];
};

/**
 * Note: ChainIdToChain will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const chain = ChainIdToChain[ChainId.Ethereum];
 * +const { chain } = getChainConfig(ChainId.Ethereum);
 * ```
 */
export const ChainIdToChain = Object.fromEntries(
  AllChainConfigs.flatMap(({ chainId, chain }) => [[chainId, chain] as const]),
) as {
  readonly [K in ChainId]: Extract<ChainConfig, { chainId: K }>["chain"];
};

/**
 * Note: BaseDecimal will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const baseDecimal = BaseDecimal[Chain.Ethereum];
 * +const { baseDecimal } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BaseDecimal = Object.fromEntries(
  AllChainConfigs.flatMap(({ baseDecimal, chain }) => [[chain, baseDecimal] as const]),
) as {
  readonly [K in Chain]: Extract<ChainConfig, { chain: K }>["baseDecimal"];
};

/**
 * Note: BlockTimes will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const blockTime = BlockTimes[Chain.Ethereum];
 * +const { blockTime } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BlockTimes = Object.fromEntries(
  AllChainConfigs.flatMap(({ blockTime, chain }) => [[chain, blockTime] as const]),
) as {
  readonly [K in Chain]: Extract<ChainConfig, { chain: K }>["blockTime"];
};
