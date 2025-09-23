import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "evm";

const ETHConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://etherscan.io",
  blockTime: 12.5,
  chain: Chain.Ethereum,
  chainId: ChainId.ETH,
  chainIdHex: "0x1",
  explorerUrl: "https://etherscan.io",
  name: "Ethereum",
  nativeCurrency: "ETH",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://cloudflare-eth.com"],
  type,
});

const BSCConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://bscscan.com",
  blockTime: 3,
  chain: Chain.BinanceSmartChain,
  chainId: ChainId.BSC,
  chainIdHex: "0x38",
  explorerUrl: "https://bscscan.com",
  name: "BinanceSmartChain",
  nativeCurrency: "BNB",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: [
    "https://bsc-dataseed.binance.org",
    "https://bsc-rpc.gateway.pokt.network",
    "https://bsc-dataseed2.binance.org",
  ],
  type,
});

const AVAXConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://snowtrace.io",
  blockTime: 3,
  chain: Chain.Avalanche,
  chainId: ChainId.AVAX,
  chainIdHex: "0xa86a",
  explorerUrl: "https://snowtrace.io",
  name: "Avalanche",
  nativeCurrency: "AVAX",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com",
  ],
  type,
});

const POLConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://polygonscan.com",
  blockTime: 2.1,
  chain: Chain.Polygon,
  chainId: ChainId.POL,
  chainIdHex: "0x89",
  explorerUrl: "https://polygonscan.com",
  name: "Polygon",
  nativeCurrency: "POL",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://polygon-rpc.com", "https://polygon.llamarpc.com", "https://polygon-bor-rpc.publicnode.com"],
  type,
});

const ARBConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://arbiscan.io",
  blockTime: 0.3,
  chain: Chain.Arbitrum,
  chainId: ChainId.ARB,
  chainIdHex: "0xa4b1",
  explorerUrl: "https://arbiscan.io",
  name: "Arbitrum",
  nativeCurrency: "ETH",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: [
    "https://arb1.arbitrum.io/rpc",
    "https://arb-mainnet.g.alchemy.com/v2/demo",
    "https://arbitrum.blockpi.network/v1/rpc/public",
  ],
  type,
});

const OPConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://optimistic.etherscan.io",
  blockTime: 2,
  chain: Chain.Optimism,
  chainId: ChainId.OP,
  chainIdHex: "0xa",
  explorerUrl: "https://optimistic.etherscan.io",
  name: "Optimism",
  nativeCurrency: "ETH",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://mainnet.optimism.io", "https://optimism.llamarpc.com", "https://1rpc.io/op"],
  type,
});

const BASEConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://basescan.org",
  blockTime: 2,
  chain: Chain.Base,
  chainId: ChainId.BASE,
  chainIdHex: "0x2105",
  explorerUrl: "https://basescan.org",
  name: "Base",
  nativeCurrency: "ETH",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://base-rpc.publicnode.com", "https://base.blockpi.network/v1/rpc/public", "https://1rpc.io/base"],
  type,
});

const GNOConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://gnosisscan.io",
  blockTime: 5.2,
  chain: Chain.Gnosis,
  chainId: ChainId.GNO,
  chainIdHex: "0x64",
  explorerUrl: "https://gnosisscan.io",
  name: "Gnosis",
  nativeCurrency: "xDAI",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://gnosis-rpc.publicnode.com", "https://gnosis.drpc.org", "https://rpc.ankr.com/gnosis"],
  type,
});

const AURORAConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://explorer.mainnet.aurora.dev",
  blockTime: 1,
  chain: Chain.Aurora,
  chainId: ChainId.AURORA,
  chainIdHex: "0x4e454152",
  explorerUrl: "https://explorer.mainnet.aurora.dev",
  name: "Aurora",
  nativeCurrency: "ETH",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://aurora-rpc.publicnode.com", "https://1rpc.io/aurora", "https://mainnet.aurora.dev"],
  type,
});

const BERAConfig = createChain({
  baseDecimal: 18,
  blockExplorerUrl: "https://berascan.com",
  blockTime: 2,
  chain: Chain.Berachain,
  chainId: ChainId.BERA,
  chainIdHex: "0x138de",
  explorerUrl: "https://berascan.com",
  name: "Berachain",
  nativeCurrency: "BERA",
  networkDerivationPath: [44, 60, 0, 0, 0],
  rpcUrls: ["https://berachain-rpc.publicnode.com", "https://rpc.berachain.com", "https://berachain.drpc.org"],
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
