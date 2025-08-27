import { createChain, mapChains } from "./_createChain";

const type = "substrate";

const DOT = createChain({
  baseDecimal: 10,
  blockExplorerUrl: "https://polkadot.subscan.io",
  blockTime: 6,
  chain: "DOT",
  chainId: "polkadot",
  explorerUrl: "https://polkadot.subscan.io",
  name: "Polkadot",
  nativeCurrency: "DOT",
  rpcUrl: "wss://rpc.polkadot.io",
  type,
});

const FLIP = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://explorer.polkascan.io/polkadot",
  blockTime: 5,
  chain: "FLIP",
  chainId: "chainflip",
  explorerUrl: "https://explorer.polkascan.io/polkadot",
  name: "Chainflip",
  nativeCurrency: "FLIP",
  rpcUrl: "wss://mainnet-archive.chainflip.io",
  type,
});

export const SubstrateChainConfigs = [DOT, FLIP] as const;
export const SubstrateChains = mapChains(SubstrateChainConfigs);
export type SubstrateChain = (typeof SubstrateChains)[number];
