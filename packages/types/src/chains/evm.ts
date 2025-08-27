import { createChain, mapChains } from "./_createChain";

const type = "evm";

const ETHConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://etherscan.io",
  blockTime: 12.5,
  chain: "ETH",
  chainId: "1",
  chainIdHex: "0x1",
  explorerUrl: "https://etherscan.io",
  name: "Ethereum",
  nativeCurrency: "ETH",
  rpcUrl: "https://ethereum-rpc.publicnode.com",
  type,
});

const BSCConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://bscscan.com",
  blockTime: 3,
  chain: "BSC",
  chainId: "56",
  chainIdHex: "0x38",
  explorerUrl: "https://bscscan.com",
  name: "BinanceSmartChain",
  nativeCurrency: "BNB",
  rpcUrl: "https://bsc-dataseed.binance.org",
  type,
});

const AVAXConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://snowtrace.io",
  blockTime: 3,
  chain: "AVAX",
  chainId: "43114",
  chainIdHex: "0xa86a",
  explorerUrl: "https://snowtrace.io",
  name: "Avalanche",
  nativeCurrency: "AVAX",
  rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  type,
});

const POLConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://polygonscan.com",
  blockTime: 2.1,
  chain: "POL",
  chainId: "137",
  chainIdHex: "0x89",
  explorerUrl: "https://polygonscan.com",
  name: "Polygon",
  nativeCurrency: "POL",
  rpcUrl: "https://polygon-rpc.com",
  type,
});

const ARBConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://arbiscan.io",
  blockTime: 0.3,
  chain: "ARB",
  chainId: "42161",
  chainIdHex: "0xa4b1",
  explorerUrl: "https://arbiscan.io",
  name: "Arbitrum",
  nativeCurrency: "ETH",
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  type,
});

const OPConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://optimistic.etherscan.io",
  blockTime: 2,
  chain: "OP",
  chainId: "10",
  chainIdHex: "0xa",
  explorerUrl: "https://optimistic.etherscan.io",
  name: "Optimism",
  nativeCurrency: "ETH",
  rpcUrl: "https://mainnet.optimism.io",
  type,
});

const BASEConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://basescan.org",
  blockTime: 2,
  chain: "BASE",
  chainId: "8453",
  chainIdHex: "0x2105",
  explorerUrl: "https://basescan.org",
  name: "Base",
  nativeCurrency: "ETH",
  rpcUrl: "https://base-rpc.publicnode.com",
  type,
});

const GNOConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://gnosisscan.io",
  blockTime: 5.2,
  chain: "GNO",
  chainId: "100",
  chainIdHex: "0x64",
  explorerUrl: "https://gnosisscan.io",
  name: "Gnosis",
  nativeCurrency: "xDAI",
  rpcUrl: "https://gnosis-rpc.publicnode.com",
  type,
});

const AURORAConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://explorer.mainnet.aurora.dev",
  blockTime: 1,
  chain: "AURORA",
  chainId: "1313161554",
  chainIdHex: "0x4e454152",
  explorerUrl: "https://explorer.mainnet.aurora.dev",
  name: "Aurora",
  nativeCurrency: "ETH",
  rpcUrl: "https://aurora-rpc.publicnode.com",
  type,
});

const BERAConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://berascan.com",
  blockTime: 2,
  chain: "BERA",
  chainId: "80094",
  chainIdHex: "0x138de",
  explorerUrl: "https://berascan.com",
  name: "Berachain",
  nativeCurrency: "BERA",
  rpcUrl: "https://berachain-rpc.publicnode.com",
  type,
});

export const EVMChainConfigs = [
  ETHConfig,
  BSCConfig,
  AVAXConfig,
  POLConfig,
  ARBConfig,
  OPConfig,
  BASEConfig,
  GNOConfig,
  AURORAConfig,
  BERAConfig,
] as const;

export const EVMChains = mapChains(EVMChainConfigs);
export type EVMChain = (typeof EVMChains)[number];
