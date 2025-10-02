import { Chain, type ChainId, StagenetChain } from "./_enums";
import { CosmosChainConfigs, StagenetMAYAConfig, StagenetTHORConfig } from "./cosmos";
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

const { chainIdToChain, chainToBaseDecimal, chainToBlockTime, explorerUrls, rpcUrls } = AllChains.reduce(
  (acc, chain) => {
    const { chainId, baseDecimal, blockTime, explorerUrl, rpcUrls } = getChainConfig(chain);

    acc.chainIdToChain[chainId] = chain;
    acc.chainToBaseDecimal[chain] = baseDecimal;
    acc.chainToBlockTime[chain] = blockTime;
    acc.explorerUrls[chain] = explorerUrl;
    acc.rpcUrls[chain] = rpcUrls[0] || "";
    return acc;
  },
  {
    chainIdToChain: {},
    chainToBaseDecimal: {},
    chainToBlockTime: {},
    explorerUrls: {},
    rpcUrls: {
      [StagenetChain.Maya]: StagenetMAYAConfig.rpcUrls[0],
      [StagenetChain.THORChain]: StagenetTHORConfig.rpcUrls[0],
    },
  } as {
    chainIdToChain: Record<ChainId, Chain>;
    chainToBaseDecimal: Record<Chain, number>;
    chainToBlockTime: Record<Chain, number>;
    explorerUrls: Record<Chain, string>;
    rpcUrls: Record<Chain | StagenetChain, string>;
  },
);

export const NODE_URLS = {
  [Chain.THORChain]: "https://thornode.ninerealms.com",
  [Chain.Maya]: "https://mayanode.mayachain.info",
  [StagenetChain.THORChain]: "https://stagenet-thornode.ninerealms.com",
  [StagenetChain.Maya]: "https://stagenet.mayanode.mayachain.info",
};

/**
 * @example
 * ```diff
 * -const rpcUrl = RPC_URLS[Chain.Ethereum];
 * +const { rpcUrls: [rpcUrl] } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const RPC_URLS: Record<Chain | StagenetChain, string> = rpcUrls;

/**
 * @example
 * ```diff
 * -const explorerUrl = EXPLORER_URLS[Chain.Ethereum];
 * +const { explorerUrl } = getChainConfig(Chain.Ethereum);
 */
export const EXPLORER_URLS: Record<Chain, string> = explorerUrls;

/**
 *
 * Note: ChainIdToChain will be discontinued in future versions.
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
  readonly [K in Chain | StagenetChain]: Extract<ChainConfig, { chain: K }>["chainId"];
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
export const ChainIdToChain = chainIdToChain;

/**
 * Note: BaseDecimal will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const baseDecimal = BaseDecimal[Chain.Ethereum];
 * +const { baseDecimal } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BaseDecimal = chainToBaseDecimal;

/**
 * Note: BlockTimes will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const blockTime = BlockTimes[Chain.Ethereum];
 * +const { blockTime } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const BlockTimes = chainToBlockTime;
