import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "substrate";

const DOT = createChain({
  baseDecimal: 10,
  blockExplorerUrl: "https://polkadot.subscan.io",
  blockTime: 6,
  chain: Chain.Polkadot,
  chainId: ChainId.DOT,
  explorerUrl: "https://polkadot.subscan.io",
  name: "Polkadot",
  nativeCurrency: "DOT",
  networkDerivationPath: [0, 0, 0, 0, 0],
  rpcUrls: ["wss://rpc.polkadot.io", "wss://polkadot-rpc.dwellir.com", "wss://polkadot.api.onfinality.io/public-ws"],
  type,
});

const FLIP = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://explorer.polkascan.io/polkadot",
  blockTime: 5,
  chain: Chain.Chainflip,
  chainId: ChainId.FLIP,
  explorerUrl: "https://explorer.polkascan.io/polkadot",
  name: "Chainflip",
  nativeCurrency: "FLIP",
  networkDerivationPath: [0, 0, 0, 0, 0],
  rpcUrls: [
    "wss://mainnet-archive.chainflip.io",
    "wss://archive-1.mainnet.chainflip.io",
    "wss://archive-2.mainnet.chainflip.io",
  ],
  type,
});

// const TAO = createChain({
//   baseDecimal: 18,
//   blockExplorerUrl: "https://taoscan.io",
//   blockTime: 5,
//   chain: Chain.TAO,
//   chainId: ChainId.TAO,
//   explorerUrl: "https://taoscan.io",
//   name: "TAO",
//   nativeCurrency: "TAO",
//   networkDerivationPath: [0, 0, 0, 0, 0],
//   rpcUrls: ["wss://rpc.tao.network"],
//   type,
// });

export const SubstrateChainConfigs = [DOT, FLIP] as const;
export const SubstrateChains = SubstrateChainConfigs.map((config) => config.chain);
export type SubstrateChain = (typeof SubstrateChains)[number];
