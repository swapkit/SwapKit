import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "others";

const NEAR = createChain({
  baseDecimal: 24,
  blockExplorerUrl: "https://nearblocks.io",
  blockTime: 1,
  chain: Chain.Near,
  chainId: ChainId.NEAR,
  explorerUrl: "https://nearblocks.io",
  name: "Near",
  nativeCurrency: "NEAR",
  networkDerivationPath: [44, 397, 0, 0, 0],
  rpcUrls: [
    "https://rpc.mainnet.near.org",
    "https://1rpc.io/near",
    "https://near.lava.build",
    "https://near-mainnet.infura.io/v3/3cbfcafa5e1e48b7bb0ea41f2fbc4abf",
  ],
  type,
});

const XRD = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://dashboard.radixdlt.com",
  blockTime: 5,
  chain: Chain.Radix,
  chainId: ChainId.XRD,
  explorerUrl: "https://dashboard.radixdlt.com",
  name: "Radix",
  nativeCurrency: "XRD",
  networkDerivationPath: [0, 0, 0, 0, 0],
  rpcUrls: [
    "https://radix-mainnet.rpc.grove.city/v1/326002fc/core",
    "https://mainnet.radixdlt.com",
    "https://radix-mainnet.rpc.grove.city/v1",
  ],
  type,
});

const XRP = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://livenet.xrpl.org/",
  blockTime: 5,
  chain: Chain.Ripple,
  chainId: ChainId.XRP,
  explorerUrl: "https://livenet.xrpl.org/",
  name: "Ripple",
  nativeCurrency: "XRP",
  networkDerivationPath: [44, 144, 0, 0, 0],
  rpcUrls: ["wss://xrpl.ws/", "wss://s1.ripple.com/", "wss://s2.ripple.com/"],
  type,
});

const SOL = createChain({
  baseDecimal: 9,
  blockExplorerUrl: "https://solscan.io",
  blockTime: 0.4,
  chain: Chain.Solana,
  chainId: ChainId.SOL,
  explorerUrl: "https://solscan.io",
  name: "Solana",
  nativeCurrency: "SOL",
  networkDerivationPath: [44, 501, 0, 0, 0],
  rpcUrls: [
    "https://solana-rpc.publicnode.com",
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.rpc.extrnode.com",
  ],
  type,
});

const TON = createChain({
  baseDecimal: 9,
  blockExplorerUrl: "https://tonscan.org",
  blockTime: 5,
  chain: Chain.Ton,
  chainId: ChainId.TON,
  explorerUrl: "https://tonscan.org",
  name: "Ton",
  nativeCurrency: "TON",
  networkDerivationPath: [44, 607, 0, 0, 0],
  rpcUrls: ["https://toncenter.com/api/v2/jsonRPC"],
  type,
});

const TRON = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://tronscan.org",
  blockTime: 3,
  chain: Chain.Tron,
  chainId: ChainId.TRON,
  chainIdHex: "0x2b6653dc",
  explorerUrl: "https://tronscan.org",
  name: "Tron",
  nativeCurrency: "TRX",
  networkDerivationPath: [44, 195, 0, 0, 0],
  rpcUrls: ["https://tron-rpc.publicnode.com", "https://api.tronstack.io", "https://api.tron.network"],
  type,
});

const SUI = createChain({
  baseDecimal: 9,
  blockExplorerUrl: "https://suiscan.io",
  blockTime: 5,
  chain: Chain.Sui,
  chainId: ChainId.SUI,
  explorerUrl: "https://suiscan.io",
  name: "Sui",
  nativeCurrency: "SUI",
  networkDerivationPath: [44, 784, 0, 0, 0],
  rpcUrls: ["https://fullnode.mainnet.sui.io:443"],
  type,
});

const ADA = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://cexplorer.io",
  blockTime: 600,
  chain: Chain.Cardano,
  chainId: ChainId.ADA,
  explorerUrl: "https://cexplorer.io",
  name: "Cardano",
  nativeCurrency: "ADA",
  networkDerivationPath: [1852, 1815, 0, 0, 0],
  rpcUrls: ["https://cardano-mainnet.blockfrost.io/api/v0"],
  type,
});

const FIAT = createChain({
  baseDecimal: 2,
  blockExplorerUrl: "",
  blockTime: 60,
  chain: Chain.Fiat,
  chainId: ChainId.FIAT,
  explorerUrl: "",
  name: "Fiat",
  nativeCurrency: "USD",
  networkDerivationPath: [0, 0, 0, 0, 0],
  rpcUrls: [""],
  type,
});

export const OtherChainConfigs = [NEAR, XRD, XRP, SOL, TON, TRON, SUI, ADA, FIAT] as const;
export const OtherChains = OtherChainConfigs.map((config) => config.chain);
export type OtherChain = (typeof OtherChains)[number];
