import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "evm";

const ETHConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://etherscan.io",
  blockTime: 12.5,
  chain: Chain.Ethereum,
  chainId: ChainId.Ethereum,
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
  chain: Chain.BinanceSmartChain,
  chainId: ChainId.BinanceSmartChain,
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
  chain: Chain.Avalanche,
  chainId: ChainId.Avalanche,
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
  chain: Chain.Polygon,
  chainId: ChainId.Polygon,
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
  chain: Chain.Arbitrum,
  chainId: ChainId.Arbitrum,
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
  chain: Chain.Optimism,
  chainId: ChainId.Optimism,
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
  chain: Chain.Base,
  chainId: ChainId.Base,
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
  chain: Chain.Gnosis,
  chainId: ChainId.Gnosis,
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
  chain: Chain.Aurora,
  chainId: ChainId.Aurora,
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
  chain: Chain.Berachain,
  chainId: ChainId.Berachain,
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
export const EVMChains = [
  Chain.Arbitrum,
  Chain.Aurora,
  Chain.Avalanche,
  Chain.Base,
  Chain.Berachain,
  Chain.BinanceSmartChain,
  Chain.Ethereum,
  Chain.Gnosis,
  Chain.Optimism,
  Chain.Polygon,
] as const;
export type EVMChain = (typeof EVMChains)[number];
