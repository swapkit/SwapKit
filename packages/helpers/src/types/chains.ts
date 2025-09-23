import {
  AllChains,
  Chain,
  getChainConfig,
  StagenetChain,
  StagenetMAYAConfig,
  StagenetTHORConfig,
} from "@swapkit/types";

/**
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const rpcUrl = RPC_URLS[Chain.Ethereum];
 * +const { rpcUrls: [rpcUrl] } = getChainConfig(Chain.Ethereum);
 * ```
 */
export const RPC_URLS: Record<Chain | StagenetChain, string> = AllChains.reduce(
  (acc, chain) => {
    acc[chain] = getChainConfig(chain).rpcUrls[0];
    return acc;
  },
  {
    [StagenetChain.Maya]: StagenetMAYAConfig.rpcUrls[0],
    [StagenetChain.THORChain]: StagenetTHORConfig.rpcUrls[0],
  } as Record<Chain | StagenetChain, string>,
);

/**
 * @deprecated
 */
export const NODE_URLS = {
  [Chain.THORChain]: "https://thornode.ninerealms.com",
  [Chain.Maya]: "https://mayanode.mayachain.info",
  [StagenetChain.THORChain]: "https://stagenet-thornode.ninerealms.com",
  [StagenetChain.Maya]: "https://stagenet.mayanode.mayachain.info",
};

/**
 * @deprecated use getChainConfig instead
 * @example
 * ```diff
 * -const explorerUrl = EXPLORER_URLS[Chain.Ethereum];
 * +const { blockExplorerUrl } = getChainConfig(Chain.Ethereum);
 */
export const EXPLORER_URLS: Record<Chain, string> = AllChains.reduce(
  (acc, chain) => {
    acc[chain] = getChainConfig(chain).blockExplorerUrl;
    return acc;
  },
  {} as Record<Chain, string>,
);
