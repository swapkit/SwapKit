import { match } from "ts-pattern";
import { SwapKitError } from "../modules/swapKitError";

export enum Chain {
  Arbitrum = "ARB",
  Avalanche = "AVAX",
  Base = "BASE",
  BinanceSmartChain = "BSC",
  Bitcoin = "BTC",
  BitcoinCash = "BCH",
  Cosmos = "GAIA",
  Dash = "DASH",
  Dogecoin = "DOGE",
  Ethereum = "ETH",
  Fiat = "FIAT",
  Kujira = "KUJI",
  Litecoin = "LTC",
  Maya = "MAYA",
  Near = "NEAR",
  Optimism = "OP",
  Polkadot = "DOT",
  Chainflip = "FLIP",
  Polygon = "MATIC",
  Radix = "XRD",
  Ripple = "XRP",
  THORChain = "THOR",
  Solana = "SOL",
  Tron = "TRX",
}

export enum StagenetChain {
  THORChain = "THOR_STAGENET",
  Maya = "MAYA_STAGENET",
}

export enum ChainId {
  Arbitrum = "42161",
  ArbitrumHex = "0xa4b1",
  Avalanche = "43114",
  AvalancheHex = "0xa86a",
  Base = "8453",
  BaseHex = "0x2105",
  BinanceSmartChain = "56",
  BinanceSmartChainHex = "0x38",
  Bitcoin = "bitcoin",
  BitcoinCash = "bitcoincash",
  Chainflip = "chainflip",
  Cosmos = "cosmoshub-4",
  Dash = "dash",
  Dogecoin = "dogecoin",
  Kujira = "kaiyo-1",
  Ethereum = "1",
  EthereumHex = "0x1",
  Fiat = "fiat",
  Litecoin = "litecoin",
  Maya = "mayachain-mainnet-v1",
  MayaStagenet = "mayachain-stagenet-v1",
  Near = "near",
  Optimism = "10",
  OptimismHex = "0xa",
  Polkadot = "polkadot",
  Polygon = "137",
  PolygonHex = "0x89",
  Radix = "radix-mainnet",
  Ripple = "ripple",
  THORChain = "thorchain-1",
  THORChainStagenet = "thorchain-stagenet-v2",
  Solana = "solana",
  Tron = "tron",
}

export const ChainIdToChain: Record<ChainId, Chain> = {
  [ChainId.ArbitrumHex]: Chain.Arbitrum,
  [ChainId.Arbitrum]: Chain.Arbitrum,
  [ChainId.AvalancheHex]: Chain.Avalanche,
  [ChainId.Avalanche]: Chain.Avalanche,
  [ChainId.BaseHex]: Chain.Base,
  [ChainId.Base]: Chain.Base,
  [ChainId.BinanceSmartChainHex]: Chain.BinanceSmartChain,
  [ChainId.BinanceSmartChain]: Chain.BinanceSmartChain,
  [ChainId.BitcoinCash]: Chain.BitcoinCash,
  [ChainId.Bitcoin]: Chain.Bitcoin,
  [ChainId.Chainflip]: Chain.Chainflip,
  [ChainId.Cosmos]: Chain.Cosmos,
  [ChainId.Dash]: Chain.Dash,
  [ChainId.Dogecoin]: Chain.Dogecoin,
  [ChainId.EthereumHex]: Chain.Ethereum,
  [ChainId.Ethereum]: Chain.Ethereum,
  [ChainId.Fiat]: Chain.Fiat,
  [ChainId.Kujira]: Chain.Kujira,
  [ChainId.Litecoin]: Chain.Litecoin,
  [ChainId.MayaStagenet]: Chain.Maya,
  [ChainId.Maya]: Chain.Maya,
  [ChainId.Near]: Chain.Near,
  [ChainId.OptimismHex]: Chain.Optimism,
  [ChainId.Optimism]: Chain.Optimism,
  [ChainId.Polkadot]: Chain.Polkadot,
  [ChainId.PolygonHex]: Chain.Polygon,
  [ChainId.Polygon]: Chain.Polygon,
  [ChainId.Radix]: Chain.Radix,
  [ChainId.Ripple]: Chain.Ripple,
  [ChainId.Solana]: Chain.Solana,
  [ChainId.THORChainStagenet]: Chain.THORChain,
  [ChainId.THORChain]: Chain.THORChain,
  [ChainId.Tron]: Chain.Tron,
};

type ChainNameType = keyof typeof Chain;
const chainNames = Object.keys(Chain) as ChainNameType[];
const chains = Object.values(Chain) as Chain[];

export const BaseDecimal: Record<Chain, number> = {
  ARB: 18,
  AVAX: 18,
  BASE: 18,
  BCH: 8,
  BSC: 18,
  BTC: 8,
  DASH: 8,
  DOGE: 8,
  DOT: 10,
  ETH: 18,
  FIAT: 2,
  FLIP: 18,
  GAIA: 6,
  KUJI: 6,
  LTC: 8,
  MATIC: 18,
  MAYA: 8,
  NEAR: 24,
  OP: 18,
  SOL: 9,
  THOR: 8,
  TRX: 6,
  XRD: 18,
  XRP: 6,
};

export const BlockTimes: Record<Partial<Chain>, number> = {
  [Chain.Arbitrum]: 0.3,
  [Chain.Avalanche]: 3,
  [Chain.Base]: 2,
  [Chain.BinanceSmartChain]: 3,
  [Chain.Bitcoin]: 600,
  [Chain.BitcoinCash]: 600,
  [Chain.Chainflip]: 5,
  [Chain.Cosmos]: 2,
  [Chain.Dash]: 150,
  [Chain.Dogecoin]: 600,
  [Chain.Ethereum]: 12.5,
  [Chain.Fiat]: 60,
  [Chain.Kujira]: 2.2,
  [Chain.Litecoin]: 150,
  [Chain.Maya]: 6,
  [Chain.Near]: 1,
  [Chain.Optimism]: 2,
  [Chain.Polkadot]: 6,
  [Chain.Polygon]: 2.1,
  [Chain.Radix]: 5,
  [Chain.Ripple]: 5,
  [Chain.Solana]: 0.4,
  [Chain.THORChain]: 6,
  [Chain.Tron]: 3,
};

export type SubstrateChain = Chain.Polkadot | Chain.Chainflip;
export const SubstrateChains = [Chain.Polkadot, Chain.Chainflip];

export type EVMChain =
  | Chain.Arbitrum
  | Chain.Avalanche
  | Chain.Base
  | Chain.BinanceSmartChain
  | Chain.Ethereum
  | Chain.Optimism
  | Chain.Polygon;

export const EVMChains = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Ethereum,
  Chain.Optimism,
  Chain.Polygon,
] as const;

export type UTXOChain =
  | Chain.Bitcoin
  | Chain.BitcoinCash
  | Chain.Dash
  | Chain.Dogecoin
  | Chain.Litecoin;
export const UTXOChains = [
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
] as const;

export type CosmosChain = Chain.Cosmos | Chain.THORChain | Chain.Maya | Chain.Kujira;
export const CosmosChains = [Chain.Cosmos, Chain.THORChain, Chain.Maya, Chain.Kujira] as const;
export const CosmosChainPrefixes = {
  [Chain.Cosmos]: "cosmos",
  [Chain.THORChain]: "thor",
  [Chain.Maya]: "maya",
  [Chain.Kujira]: "kujira",
} as Record<CosmosChain, string>;

export const TCSupportedChains = [
  Chain.Avalanche,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.THORChain,
] as const;

export const MAYASupportedChains = [
  Chain.Arbitrum,
  Chain.Dash,
  Chain.Ethereum,
  Chain.Kujira,
  Chain.Maya,
  Chain.THORChain,
] as const;

export const RPC_URLS: Record<Chain | StagenetChain, string> = {
  [Chain.Arbitrum]: "https://arb1.arbitrum.io/rpc",
  [Chain.Avalanche]: "https://api.avax.network/ext/bc/C/rpc",
  [Chain.Base]: "https://base-rpc.publicnode.com",
  [Chain.BinanceSmartChain]: "https://bsc-dataseed.binance.org",
  [Chain.BitcoinCash]: "https://node-router.thorswap.net/bitcoin-cash",
  [Chain.Bitcoin]: "https://bitcoin-rpc.publicnode.com",
  [Chain.Chainflip]: "wss://mainnet-archive.chainflip.io",
  [Chain.Cosmos]: "https://node-router.thorswap.net/cosmos/rpc",
  [Chain.Dash]: "https://dash-rpc.publicnode.com",
  [Chain.Dogecoin]: "https://node-router.thorswap.net/dogecoin",
  [Chain.Ethereum]: "https://ethereum-rpc.publicnode.com",
  [Chain.Fiat]: "",
  [Chain.Kujira]: "https://kujira-rpc.ibs.team",
  [Chain.Litecoin]: "https://node-router.thorswap.net/litecoin",
  [Chain.Maya]: "https://tendermint.mayachain.info",
  [Chain.Near]: "https://rpc.mainnet.near.org",
  [Chain.Optimism]: "https://mainnet.optimism.io",
  [Chain.Polkadot]: "wss://rpc.polkadot.io",
  [Chain.Polygon]: "https://polygon-rpc.com",
  [Chain.Radix]: "https://radix-mainnet.rpc.grove.city/v1/326002fc/core",
  [Chain.Ripple]: "wss://xrpl.ws/",
  [Chain.Solana]: "https://solana-rpc.publicnode.com",
  [Chain.THORChain]: "https://rpc.thorswap.net",
  [Chain.Tron]: "https://api.trongrid.io",
  [StagenetChain.Maya]: "https://stagenet.tendermint.mayachain.info",
  [StagenetChain.THORChain]: "https://stagenet-rpc.ninerealms.com",
};

export const NODE_URLS: Record<
  Chain.THORChain | Chain.Maya | StagenetChain.THORChain | StagenetChain.Maya,
  string
> = {
  [Chain.THORChain]: "https://thornode.thorswap.net",
  [Chain.Maya]: "https://mayanode.mayachain.info",
  [StagenetChain.THORChain]: "https://stagenet-thornode.ninerealms.com",
  [StagenetChain.Maya]: "https://stagenet.mayanode.mayachain.info",
};

export const FALLBACK_URLS: Record<Chain | StagenetChain, string[]> = {
  [Chain.Arbitrum]: [
    "https://arb-mainnet.g.alchemy.com/v2/demo",
    "https://arbitrum.blockpi.network/v1/rpc/public",
  ],
  [Chain.Avalanche]: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com",
  ],
  [Chain.Base]: ["https://base.blockpi.network/v1/rpc/public", "https://1rpc.io/base"],
  [Chain.BinanceSmartChain]: [
    "https://bsc-rpc.gateway.pokt.network",
    "https://bsc-dataseed2.binance.org",
  ],
  [Chain.Bitcoin]: ["https://bitcoin.publicnode.com"],
  [Chain.BitcoinCash]: ["https://bch-dataseed.binance.org", "https://bch.getblock.io/mainnet"],
  [Chain.Chainflip]: [
    "wss://archive-1.mainnet.chainflip.io",
    "wss://archive-2.mainnet.chainflip.io",
  ],
  [Chain.Cosmos]: ["https://cosmos-rpc.quickapi.com", "https://cosmos-rpc.publicnode.com"],
  [Chain.Dash]: ["https://dash-rpc.publicnode.com"],
  [Chain.Dogecoin]: ["https://doge.getblock.io/mainnet", "https://dogecoin.publicnode.com"],
  [Chain.Ethereum]: ["https://eth.llamarpc.com", "https://cloudflare-eth.com"],
  [Chain.Fiat]: [],
  [Chain.Kujira]: ["https://kujira-rpc.polkachu.com", "https://rpc-kujira.synergynodes.com/"],
  [Chain.Litecoin]: ["https://ltc.getblock.io/mainnet", "https://litecoin.publicnode.com"],
  [Chain.Maya]: ["https://tendermint.mayachain.info", "https://maya-tendermint.publicnode.com"],
  [StagenetChain.Maya]: [],
  [Chain.Near]: [
    "https://1rpc.io/near",
    "https://near.lava.build",
    "https://near-mainnet.infura.io/v3/3cbfcafa5e1e48b7bb0ea41f2fbc4abf",
  ],
  [Chain.Optimism]: ["https://optimism.llamarpc.com", "https://1rpc.io/op"],
  [Chain.Polkadot]: [
    "wss://polkadot-rpc.dwellir.com",
    "wss://polkadot.api.onfinality.io/public-ws",
  ],
  [Chain.Polygon]: ["https://polygon.llamarpc.com", "https://polygon-bor-rpc.publicnode.com"],
  [Chain.Radix]: ["https://mainnet.radixdlt.com", "https://radix-mainnet.rpc.grove.city/v1"],
  [Chain.Ripple]: ["wss://s1.ripple.com/", "wss://s2.ripple.com/"],
  [Chain.THORChain]: ["https://thornode.ninerealms.com", NODE_URLS[Chain.THORChain]],
  [StagenetChain.THORChain]: [],
  [Chain.Solana]: [
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.rpc.extrnode.com",
  ],
  [Chain.Tron]: ["https://api.tronstack.io", "https://api.tron.network"],
};

export const EXPLORER_URLS: Record<Chain, string> = {
  [Chain.Arbitrum]: "https://arbiscan.io",
  [Chain.Avalanche]: "https://snowtrace.io",
  [Chain.Base]: "https://basescan.org",
  [Chain.BinanceSmartChain]: "https://bscscan.com",
  [Chain.Bitcoin]: "https://blockchair.com/bitcoin",
  [Chain.BitcoinCash]: "https://www.blockchair.com/bitcoin-cash",
  [Chain.Chainflip]: "https://explorer.polkascan.io/polkadot",
  [Chain.Cosmos]: "https://www.mintscan.io/cosmos",
  [Chain.Dash]: "https://blockchair.com/dash",
  [Chain.Dogecoin]: "https://blockchair.com/dogecoin",
  [Chain.Ethereum]: "https://etherscan.io",
  [Chain.Fiat]: "",
  [Chain.Kujira]: "https://finder.kujira.network/kaiyo-1",
  [Chain.Litecoin]: "https://blockchair.com/litecoin",
  [Chain.Maya]: "https://www.mayascan.org",
  [Chain.Near]: "https://nearblocks.io",
  [Chain.Optimism]: "https://optimistic.etherscan.io",
  [Chain.Polkadot]: "https://polkadot.subscan.io",
  [Chain.Polygon]: "https://polygonscan.com",
  [Chain.Radix]: "https://dashboard.radixdlt.com",
  [Chain.Ripple]: "https://livenet.xrpl.org/",
  [Chain.THORChain]: "https://runescan.io",
  [Chain.Solana]: "https://solscan.io",
  [Chain.Tron]: "https://tronscan.org",
};

let RPCUrlsMerged = RPC_URLS;

const getRpcBody = (chain: Chain | StagenetChain) => {
  return match(chain)
    .with(
      Chain.Arbitrum,
      Chain.Avalanche,
      Chain.Base,
      Chain.BinanceSmartChain,
      Chain.Ethereum,
      Chain.Optimism,
      Chain.Polygon,
      Chain.Tron,
      () => ({ id: 1, jsonrpc: "2.0", method: "eth_blockNumber", params: [] }),
    )
    .with(Chain.Bitcoin, Chain.Dogecoin, Chain.BitcoinCash, Chain.Dash, Chain.Litecoin, () => ({
      id: "test",
      jsonrpc: "1.0",
      method: "getblockchaininfo",
      params: [],
    }))
    .with(
      Chain.Cosmos,
      Chain.Kujira,
      Chain.Maya,
      Chain.THORChain,
      StagenetChain.Maya,
      StagenetChain.THORChain,
      () => ({ id: 1, jsonrpc: "2.0", method: "status", params: {} }),
    )
    .with(Chain.Polkadot, () => ({ id: 1, jsonrpc: "2.0", method: "system_health", params: [] }))
    .with(Chain.Solana, () => ({ id: 1, jsonrpc: "2.0", method: "getHealth" }))
    .with(Chain.Radix, () => "")
    .otherwise(() => {
      throw new SwapKitError("helpers_chain_not_supported", { chain });
    });
};

function getChainStatusEndpoint(chain: Chain | StagenetChain) {
  return chain === Chain.Radix ? "/status/network-configuration" : "";
}

const testRPCConnection = async (chain: Chain | StagenetChain, url: string) => {
  try {
    const endpoint = url.startsWith("wss") ? url.replace("wss", "https") : url;
    const response = await fetch(`${endpoint}${getChainStatusEndpoint(chain)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getRpcBody(chain)),
      signal: AbortSignal.timeout(3000),
    });

    return response.ok;
  } catch {
    return false;
  }
};

const getRPCUrlWithFallback = async (chain: Chain | StagenetChain) => {
  const primaryUrl = RPC_URLS[chain];

  if (await testRPCConnection(chain, primaryUrl)) {
    return primaryUrl;
  }

  for (const fallbackUrl of FALLBACK_URLS[chain]) {
    if (await testRPCConnection(chain, fallbackUrl)) {
      return fallbackUrl;
    }
  }

  return primaryUrl;
};

export const initializeRPCUrlsWithFallback = async (
  chains: (Chain | StagenetChain)[] = [...Object.values(Chain), ...Object.values(StagenetChain)],
) => {
  const workingUrls: Record<Chain | StagenetChain, string> = {} as Record<
    Chain | StagenetChain,
    string
  >;

  await Promise.all(
    chains.map(async (chain) => {
      const workingUrl = await getRPCUrlWithFallback(chain);
      workingUrls[chain] = workingUrl;
    }),
  );

  RPCUrlsMerged = { ...RPCUrlsMerged, ...workingUrls };
};

const ChainToChainName = chains.reduce(
  (acc, chain) => {
    const chainName = chainNames.find((key) => Chain[key as ChainNameType] === chain);

    if (chainName) acc[chain] = chainName;

    return acc;
  },
  {} as { [key in Chain]: ChainNameType },
);

export const ChainToChainId = chains.reduce(
  (acc, chain) => {
    acc[chain] = ChainId[ChainToChainName[chain]];
    return acc;
  },
  {} as { [key in Chain]: ChainId },
);

export const ChainToHexChainId = chains.reduce(
  (acc, chain) => {
    const chainString = `${ChainToChainName[chain]}Hex` as keyof typeof ChainId;

    acc[chain] = ChainId[chainString];
    return acc;
  },
  {} as { [key in Chain]: ChainId },
);

export const ChainToExplorerUrl = chains.reduce(
  (acc, chain) => {
    acc[chain] = EXPLORER_URLS[chain];
    return acc;
  },
  {} as { [key in Chain]: string },
);
