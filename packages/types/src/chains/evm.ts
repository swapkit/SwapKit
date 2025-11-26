import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "evm";
const baseDecimal = 18;
const networkDerivationPath = [44, 60, 0, 0, 0] as [number, number, number, number, number];

const ETHConfig = createChain({
  baseDecimal,
  blockTime: 12.5,
  chain: Chain.Ethereum,
  chainId: ChainId.Ethereum,
  chainIdHex: "0x1",
  explorerUrl: "https://etherscan.io",
  name: "Ethereum",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://cloudflare-eth.com"],
  type,
});

const BSCConfig = createChain({
  baseDecimal,
  blockTime: 1,
  chain: Chain.BinanceSmartChain,
  chainId: ChainId.BinanceSmartChain,
  chainIdHex: "0x38",
  explorerUrl: "https://bscscan.com",
  name: "BinanceSmartChain",
  nativeCurrency: "BNB",
  networkDerivationPath,
  rpcUrls: [
    "https://bsc-dataseed.binance.org",
    "https://bsc-rpc.gateway.pokt.network",
    "https://bsc-dataseed2.binance.org",
  ],
  type,
});

const AVAXConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Avalanche,
  chainId: ChainId.Avalanche,
  chainIdHex: "0xa86a",
  explorerUrl: "https://snowtrace.io",
  name: "Avalanche",
  nativeCurrency: "AVAX",
  networkDerivationPath,
  rpcUrls: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com",
  ],
  type,
});

const POLConfig = createChain({
  baseDecimal,
  blockTime: 2.1,
  chain: Chain.Polygon,
  chainId: ChainId.Polygon,
  chainIdHex: "0x89",
  explorerUrl: "https://polygonscan.com",
  name: "Polygon",
  nativeCurrency: "POL",
  networkDerivationPath,
  rpcUrls: ["https://polygon-rpc.com", "https://polygon.llamarpc.com", "https://polygon-bor-rpc.publicnode.com"],
  type,
});

const ARBConfig = createChain({
  baseDecimal,
  blockTime: 0.3,
  chain: Chain.Arbitrum,
  chainId: ChainId.Arbitrum,
  chainIdHex: "0xa4b1",
  explorerUrl: "https://arbiscan.io",
  name: "Arbitrum",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: [
    "https://arb1.arbitrum.io/rpc",
    "https://arb-mainnet.g.alchemy.com/v2/demo",
    "https://arbitrum.blockpi.network/v1/rpc/public",
  ],
  type,
});

const OPConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Optimism,
  chainId: ChainId.Optimism,
  chainIdHex: "0xa",
  explorerUrl: "https://optimistic.etherscan.io",
  name: "Optimism",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: ["https://mainnet.optimism.io", "https://optimism.llamarpc.com", "https://1rpc.io/op"],
  type,
});

const BASEConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Base,
  chainId: ChainId.Base,
  chainIdHex: "0x2105",
  explorerUrl: "https://basescan.org",
  name: "Base",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: ["https://base-rpc.publicnode.com", "https://base.blockpi.network/v1/rpc/public", "https://1rpc.io/base"],
  type,
});

const GNOConfig = createChain({
  baseDecimal,
  blockTime: 5.2,
  chain: Chain.Gnosis,
  chainId: ChainId.Gnosis,
  chainIdHex: "0x64",
  explorerUrl: "https://gnosisscan.io",
  name: "Gnosis",
  nativeCurrency: "xDAI",
  networkDerivationPath,
  rpcUrls: ["https://gnosis-rpc.publicnode.com", "https://gnosis.drpc.org", "https://rpc.ankr.com/gnosis"],
  type,
});

const AURORAConfig = createChain({
  baseDecimal,
  blockTime: 1,
  chain: Chain.Aurora,
  chainId: ChainId.Aurora,
  chainIdHex: "0x4e454152",
  explorerUrl: "https://explorer.mainnet.aurora.dev",
  name: "Aurora",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: ["https://aurora-rpc.publicnode.com", "https://1rpc.io/aurora", "https://mainnet.aurora.dev"],
  type,
});

const BERAConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Berachain,
  chainId: ChainId.Berachain,
  chainIdHex: "0x138de",
  explorerUrl: "https://berascan.com",
  name: "Berachain",
  nativeCurrency: "BERA",
  networkDerivationPath,
  rpcUrls: ["https://berachain-rpc.publicnode.com", "https://rpc.berachain.com", "https://berachain.drpc.org"],
  type,
});

const HYPEREVMConfig = createChain({
  baseDecimal,
  blockTime: 1,
  chain: Chain.Hyperevm,
  chainId: ChainId.Hyperevm,
  chainIdHex: "0x3e7",
  explorerUrl: "https://app.hyperliquid.xyz/explorer",
  name: "Hyperliquid",
  nativeCurrency: "HYPE",
  networkDerivationPath,
  rpcUrls: ["https://rpc.hyperliquid.xyz/evm", "https://rpc.hypurrscan.io"],
  type,
});

const UNIConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Unichain,
  chainId: ChainId.Unichain,
  chainIdHex: "0x82",
  explorerUrl: "https://unichain.blockscout.com",
  name: "Unichain",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: ["https://unichain-rpc.publicnode.com", "https://unichain.drpc.org"],
  type,
});

const CORNConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Corn,
  chainId: ChainId.Corn,
  chainIdHex: "0x1406f40",
  explorerUrl: "https://cornscan.io",
  name: "Corn",
  nativeCurrency: "BTCN",
  networkDerivationPath,
  rpcUrls: ["https://mainnet.corn-rpc.com", "https://rpc.ankr.com/corn_maizenet"],
  type,
});

const COREConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Core,
  chainId: ChainId.Core,
  chainIdHex: "0x45c",
  explorerUrl: "https://corescan.io",
  name: "Core",
  nativeCurrency: "CORE",
  networkDerivationPath,
  rpcUrls: ["https://core-rpc.publicnode.com", "https://1rpc.io/core"],
  type,
});

const BOTANIXConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Botanix,
  chainId: ChainId.Botanix,
  chainIdHex: "0xe35",
  explorerUrl: "https://botanixscan.io",
  name: "Botanix",
  nativeCurrency: "BTC",
  networkDerivationPath,
  rpcUrls: ["https://core.drpc.org", "https://1rpc.io/core"],
  type,
});

const CROConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Cronos,
  chainId: ChainId.Cronos,
  chainIdHex: "0x19",
  explorerUrl: "https://croscan.io",
  name: "Cronos",
  nativeCurrency: "CRO",
  networkDerivationPath,
  rpcUrls: ["https://rpc.vvs.finance"],
  type,
});

const XLAYERConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.XLayer,
  chainId: ChainId.XLayer,
  chainIdHex: "0xc4",
  explorerUrl: "https://www.oklink.com/x-layer",
  name: "X Layer",
  nativeCurrency: "OKB",
  networkDerivationPath,
  rpcUrls: ["https://xlayerrpc.okx.com"],
  type,
});

const SONICConfig = createChain({
  baseDecimal,
  blockTime: 2,
  chain: Chain.Sonic,
  chainId: ChainId.Sonic,
  chainIdHex: "0x92",
  explorerUrl: "https://sonicscan.io",
  name: "Sonic",
  nativeCurrency: "S",
  networkDerivationPath,
  rpcUrls: ["https://rpc.sonic.xyz"],
  type,
});

const MONADConfig = createChain({
  baseDecimal,
  blockTime: 0.4,
  chain: Chain.Monad,
  chainId: ChainId.Monad,
  chainIdHex: "0x8f",
  explorerUrl: "https://monvision.io",
  name: "Monad",
  nativeCurrency: "MON",
  networkDerivationPath,
  rpcUrls: ["https://rpc.monad.xyz/", "https://rpc3.monad.xyz/", "https://rpc-mainnet.monadinfra.com/"],
  type,
});

const MEGAETHConfig = createChain({
  baseDecimal,
  blockTime: 0.01,
  chain: Chain.MegaETH,
  chainId: ChainId.MegaETH,
  chainIdHex: "0x10e6",
  explorerUrl: "",
  name: "MegaETH",
  nativeCurrency: "ETH",
  networkDerivationPath,
  rpcUrls: [],
  type,
});

export const EVMChainConfigs = [
  ARBConfig,
  AURORAConfig,
  AVAXConfig,
  BASEConfig,
  BERAConfig,
  BOTANIXConfig,
  BSCConfig,
  COREConfig,
  CORNConfig,
  CROConfig,
  ETHConfig,
  GNOConfig,
  HYPEREVMConfig,
  MEGAETHConfig,
  MONADConfig,
  OPConfig,
  POLConfig,
  SONICConfig,
  UNIConfig,
  XLAYERConfig,
] as const;
export const EVMChains = [
  Chain.Arbitrum,
  Chain.Aurora,
  Chain.Avalanche,
  Chain.Base,
  Chain.Berachain,
  Chain.BinanceSmartChain,
  Chain.Botanix,
  Chain.Core,
  Chain.Corn,
  Chain.Corn,
  Chain.Cronos,
  Chain.Ethereum,
  Chain.Gnosis,
  Chain.Hyperevm,
  // TODO: Enable once live
  // Chain.MegaETH,
  Chain.Monad,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Sonic,
  Chain.Unichain,
  Chain.XLayer,
] as const;
export type EVMChain = (typeof EVMChains)[number];
