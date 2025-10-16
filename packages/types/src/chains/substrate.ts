import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "substrate";

const DOT = createChain({
  baseDecimal: 10,
  blockTime: 6,
  chain: Chain.Polkadot,
  chainId: ChainId.Polkadot,
  explorerUrl: "https://polkadot.subscan.io",
  name: "Polkadot",
  nativeCurrency: "DOT",
  networkDerivationPath: [0, 0, 0, 0, 0],
  rpcUrls: ["wss://rpc.polkadot.io", "wss://polkadot-rpc.dwellir.com", "wss://polkadot.api.onfinality.io/public-ws"],
  type,
});

const FLIP = createChain({
  baseDecimal: 18,
  blockTime: 5,
  chain: Chain.Chainflip,
  chainId: ChainId.Chainflip,
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
export const SubstrateChains = [Chain.Polkadot, Chain.Chainflip] as const;
export type SubstrateChain = (typeof SubstrateChains)[number];
