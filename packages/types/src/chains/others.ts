import { createChain, mapChains } from "./_createChain";

const type = "others";

const NEAR = createChain({
  baseDecimal: 24,
  blockExplorerUrl: "https://nearblocks.io",
  chain: "NEAR",
  chainId: "near",
  explorerUrl: "https://nearblocks.io",
  name: "Near",
  nativeCurrency: "NEAR",
  rpcUrl: "https://rpc.mainnet.near.org",
  type,
});

const XRD = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://dashboard.radixdlt.com",
  chain: "XRD",
  chainId: "radix-mainnet",
  explorerUrl: "https://dashboard.radixdlt.com",
  name: "Radix",
  nativeCurrency: "XRD",
  rpcUrl: "https://radix-mainnet.rpc.grove.city/v1/326002fc/core",
  type,
});

const XRP = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://livenet.xrpl.org/",
  chain: "XRP",
  chainId: "ripple",
  explorerUrl: "https://livenet.xrpl.org/",
  name: "Ripple",
  nativeCurrency: "XRP",
  rpcUrl: "wss://xrpl.ws/",
  type,
});

const SOL = createChain({
  baseDecimal: 9,
  blockExplorerUrl: "https://solscan.io",
  chain: "SOL",
  chainId: "solana",
  explorerUrl: "https://solscan.io",
  name: "Solana",
  nativeCurrency: "SOL",
  rpcUrl: "https://solana-rpc.publicnode.com",
  type,
});

const TRON = createChain({
  baseDecimal: 6,
  blockExplorerUrl: "https://tronscan.org",
  chain: "TRON",
  chainId: "728126428",
  chainIdHex: "0x2b6653dc",
  explorerUrl: "https://tronscan.org",
  name: "Tron",
  nativeCurrency: "TRX",
  rpcUrl: "https://tron-rpc.publicnode.com",
  type,
});

const FIAT = createChain({
  baseDecimal: 2,
  blockExplorerUrl: "",
  chain: "FIAT",
  chainId: "fiat",
  explorerUrl: "",
  name: "Fiat",
  nativeCurrency: "USD",
  rpcUrl: "",
  type,
});

export const OtherChainConfigs = [NEAR, XRD, XRP, SOL, TRON, FIAT] as const;
export const OtherChains = mapChains(OtherChainConfigs);
export type OtherChain = (typeof OtherChains)[number];
