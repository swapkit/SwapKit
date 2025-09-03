export enum Chain {
  Arbitrum = "ARB",
  Aurora = "AURORA",
  Avalanche = "AVAX",
  Base = "BASE",
  Berachain = "BERA",
  BinanceSmartChain = "BSC",
  Bitcoin = "BTC",
  BitcoinCash = "BCH",
  Cosmos = "GAIA",
  Dash = "DASH",
  Dogecoin = "DOGE",
  Ethereum = "ETH",
  Fiat = "FIAT",
  Gnosis = "GNO",
  Kujira = "KUJI",
  Litecoin = "LTC",
  Maya = "MAYA",
  Near = "NEAR",
  Noble = "NOBLE",
  Optimism = "OP",
  Polkadot = "DOT",
  Chainflip = "FLIP",
  Polygon = "POL",
  Radix = "XRD",
  Ripple = "XRP",
  THORChain = "THOR",
  Solana = "SOL",
  Tron = "TRON",
  Zcash = "ZEC",
}

export enum StagenetChain {
  THORChain = "THOR_STAGENET",
  Maya = "MAYA_STAGENET",
}

export enum ChainId {
  Arbitrum = "42161",
  ArbitrumHex = "0xa4b1",
  Aurora = "1313161554",
  AuroraHex = "0x4e454152",
  Avalanche = "43114",
  AvalancheHex = "0xa86a",
  Base = "8453",
  BaseHex = "0x2105",
  Berachain = "80094",
  BerachainHex = "0x138de",
  BinanceSmartChain = "56",
  BinanceSmartChainHex = "0x38",
  Bitcoin = "bitcoin",
  BitcoinCash = "bitcoincash",
  Chainflip = "chainflip",
  Cosmos = "cosmoshub-4",
  Dash = "dash",
  Dogecoin = "dogecoin",
  Ethereum = "1",
  EthereumHex = "0x1",
  Fiat = "fiat",
  Gnosis = "100",
  GnosisHex = "0x64",
  Kujira = "kaiyo-1",
  Litecoin = "litecoin",
  Maya = "mayachain-mainnet-v1",
  MayaStagenet = "mayachain-stagenet-v1",
  Near = "near",
  Noble = "noble-1",
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
  Tron = "728126428",
  TronHex = "0x2b6653dc",
  Zcash = "zcash",
}

export const ChainIdToChain: Record<ChainId, Chain> = {
  [ChainId.ArbitrumHex]: Chain.Arbitrum,
  [ChainId.Arbitrum]: Chain.Arbitrum,
  [ChainId.AuroraHex]: Chain.Aurora,
  [ChainId.Aurora]: Chain.Aurora,
  [ChainId.AvalancheHex]: Chain.Avalanche,
  [ChainId.Avalanche]: Chain.Avalanche,
  [ChainId.BaseHex]: Chain.Base,
  [ChainId.Base]: Chain.Base,
  [ChainId.BerachainHex]: Chain.Berachain,
  [ChainId.Berachain]: Chain.Berachain,
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
  [ChainId.GnosisHex]: Chain.Gnosis,
  [ChainId.Gnosis]: Chain.Gnosis,
  [ChainId.Kujira]: Chain.Kujira,
  [ChainId.Litecoin]: Chain.Litecoin,
  [ChainId.MayaStagenet]: Chain.Maya,
  [ChainId.Maya]: Chain.Maya,
  [ChainId.Near]: Chain.Near,
  [ChainId.Noble]: Chain.Noble,
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
  [ChainId.TronHex]: Chain.Tron,
  [ChainId.Zcash]: Chain.Zcash,
};

type ChainNameType = keyof typeof Chain;
const chainNames = Object.keys(Chain) as ChainNameType[];
const chains = Object.values(Chain) as Chain[];

export const BaseDecimal: Record<Chain, number> = {
  ARB: 18,
  AURORA: 18,
  AVAX: 18,
  BASE: 18,
  BCH: 8,
  BERA: 18,
  BSC: 18,
  BTC: 8,
  DASH: 8,
  DOGE: 8,
  DOT: 10,
  ETH: 18,
  FIAT: 2,
  FLIP: 18,
  GAIA: 6,
  GNO: 18,
  KUJI: 6,
  LTC: 8,
  MAYA: 8,
  NEAR: 24,
  NOBLE: 6,
  OP: 18,
  POL: 18,
  SOL: 9,
  THOR: 8,
  TRON: 6,
  XRD: 18,
  XRP: 6,
  ZEC: 8,
};

export const BlockTimes: Record<Partial<Chain>, number> = {
  [Chain.Arbitrum]: 0.3,
  [Chain.Aurora]: 1,
  [Chain.Avalanche]: 3,
  [Chain.Base]: 2,
  [Chain.Berachain]: 2,
  [Chain.BinanceSmartChain]: 3,
  [Chain.Bitcoin]: 600,
  [Chain.BitcoinCash]: 600,
  [Chain.Chainflip]: 5,
  [Chain.Cosmos]: 2,
  [Chain.Dash]: 150,
  [Chain.Dogecoin]: 600,
  [Chain.Ethereum]: 12.5,
  [Chain.Fiat]: 60,
  [Chain.Gnosis]: 5.2,
  [Chain.Kujira]: 2.2,
  [Chain.Litecoin]: 150,
  [Chain.Maya]: 6,
  [Chain.Near]: 1,
  [Chain.Noble]: 1.3,
  [Chain.Optimism]: 2,
  [Chain.Polkadot]: 6,
  [Chain.Polygon]: 2.1,
  [Chain.Radix]: 5,
  [Chain.Ripple]: 5,
  [Chain.Solana]: 0.4,
  [Chain.THORChain]: 6,
  [Chain.Tron]: 3,
  [Chain.Zcash]: 150,
};

export type SubstrateChain = Chain.Polkadot | Chain.Chainflip;
export const SubstrateChains = [Chain.Polkadot, Chain.Chainflip];

export type EVMChain =
  | Chain.Arbitrum
  | Chain.Aurora
  | Chain.Avalanche
  | Chain.Base
  | Chain.Berachain
  | Chain.BinanceSmartChain
  | Chain.Ethereum
  | Chain.Gnosis
  | Chain.Optimism
  | Chain.Polygon;

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

export type UTXOChain = Chain.Bitcoin | Chain.BitcoinCash | Chain.Dash | Chain.Dogecoin | Chain.Litecoin | Chain.Zcash;

export const UTXOChains = [
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
  Chain.Zcash,
] as const;

export type CosmosChain = Chain.Cosmos | Chain.THORChain | Chain.Maya | Chain.Kujira | Chain.Noble;
export const CosmosChains = [Chain.Cosmos, Chain.THORChain, Chain.Maya, Chain.Kujira, Chain.Noble] as const;
export const CosmosChainPrefixes = {
  [Chain.Cosmos]: "cosmos",
  [Chain.THORChain]: "thor",
  [Chain.Maya]: "maya",
  [Chain.Kujira]: "kujira",
  [Chain.Noble]: "noble",
} as Record<CosmosChain, string>;

export const RPC_URLS: Record<Chain | StagenetChain, string> = {
  [Chain.Arbitrum]: "https://arb1.arbitrum.io/rpc",
  [Chain.Aurora]: "https://aurora-rpc.publicnode.com",
  [Chain.Avalanche]: "https://api.avax.network/ext/bc/C/rpc",
  [Chain.Base]: "https://base-rpc.publicnode.com",
  [Chain.Berachain]: "https://berachain-rpc.publicnode.com",
  [Chain.BinanceSmartChain]: "https://bsc-dataseed.binance.org",
  [Chain.BitcoinCash]: "https://node-router.thorswap.net/bitcoin-cash",
  [Chain.Bitcoin]: "https://bitcoin-rpc.publicnode.com",
  [Chain.Chainflip]: "wss://mainnet-archive.chainflip.io",
  [Chain.Cosmos]: "https://cosmos-rpc.publicnode.com:443",
  [Chain.Dash]: "https://dash-rpc.publicnode.com",
  [Chain.Dogecoin]: "https://node-router.thorswap.net/dogecoin",
  [Chain.Ethereum]: "https://ethereum-rpc.publicnode.com",
  [Chain.Fiat]: "",
  [Chain.Gnosis]: "https://gnosis-rpc.publicnode.com",
  [Chain.Kujira]: "https://kujira-rpc.ibs.team",
  [Chain.Litecoin]: "https://node-router.thorswap.net/litecoin",
  [Chain.Maya]: "https://tendermint.mayachain.info",
  [Chain.Near]: "https://rpc.mainnet.near.org",
  [Chain.Noble]: "https://noble-rpc.polkachu.com",
  [Chain.Optimism]: "https://mainnet.optimism.io",
  [Chain.Polkadot]: "wss://rpc.polkadot.io",
  [Chain.Polygon]: "https://polygon-rpc.com",
  // TODO - Update Radix RPC URL when available
  [Chain.Radix]: "https://radix-mainnet.rpc.grove.city/v1/326002fc/core",
  [Chain.Ripple]: "wss://xrpl.ws/",
  [Chain.Solana]: "https://solana-rpc.publicnode.com",
  [Chain.THORChain]: "https://rpc.thorswap.net",
  [Chain.Tron]: "https://tron-rpc.publicnode.com",
  [Chain.Zcash]:
    "https://api.tatum.io/v3/blockchain/node/zcash-mainnet/t-6894a2ae7fc90cccfd3ce71b-2fce88aa7f4a41a5b1e93874",
  [StagenetChain.Maya]: "",
  [StagenetChain.THORChain]: "https://stagenet-rpc.ninerealms.com",
};

export const NODE_URLS: Record<Chain.THORChain | Chain.Maya | StagenetChain.THORChain | StagenetChain.Maya, string> = {
  [Chain.THORChain]: "https://thornode.ninerealms.com",
  [Chain.Maya]: "https://mayanode.mayachain.info",
  [StagenetChain.THORChain]: "https://stagenet-thornode.ninerealms.com",
  [StagenetChain.Maya]: "https://stagenet.mayanode.mayachain.info",
};

export const FALLBACK_URLS: Record<Chain | StagenetChain, string[]> = {
  [Chain.Arbitrum]: ["https://arb-mainnet.g.alchemy.com/v2/demo", "https://arbitrum.blockpi.network/v1/rpc/public"],
  [Chain.Aurora]: ["https://1rpc.io/aurora", "https://mainnet.aurora.dev"],
  [Chain.Avalanche]: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche-c-chain-rpc.publicnode.com"],
  [Chain.Base]: ["https://base.blockpi.network/v1/rpc/public", "https://1rpc.io/base"],
  [Chain.BinanceSmartChain]: ["https://bsc-rpc.gateway.pokt.network", "https://bsc-dataseed2.binance.org"],
  [Chain.Berachain]: ["https://rpc.berachain.com", "https://berachain.drpc.org"],
  [Chain.Bitcoin]: ["https://bitcoin.publicnode.com"],
  [Chain.BitcoinCash]: ["https://bch-dataseed.binance.org", "https://bch.getblock.io/mainnet"],
  [Chain.Chainflip]: ["wss://archive-1.mainnet.chainflip.io", "wss://archive-2.mainnet.chainflip.io"],
  [Chain.Cosmos]: ["https://cosmos-rpc.publicnode.com"],
  [Chain.Dash]: ["https://dash-rpc.publicnode.com"],
  [Chain.Dogecoin]: ["https://doge.getblock.io/mainnet", "https://dogecoin.publicnode.com"],
  [Chain.Ethereum]: ["https://eth.llamarpc.com", "https://cloudflare-eth.com"],
  [Chain.Fiat]: [],
  [Chain.Gnosis]: ["https://gnosis.drpc.org", "https://rpc.ankr.com/gnosis"],
  [Chain.Kujira]: ["https://kujira-rpc.polkachu.com", "https://rpc-kujira.synergynodes.com/"],
  [Chain.Litecoin]: ["https://ltc.getblock.io/mainnet", "https://litecoin.publicnode.com"],
  [Chain.Maya]: ["https://tendermint.mayachain.info", "https://maya-tendermint.publicnode.com"],
  [StagenetChain.Maya]: [],
  [Chain.Near]: [
    "https://1rpc.io/near",
    "https://near.lava.build",
    "https://near-mainnet.infura.io/v3/3cbfcafa5e1e48b7bb0ea41f2fbc4abf",
  ],
  [Chain.Noble]: ["https://rpc.noble.xyz", "https://rpc.cosmos.directory/noble"],
  [Chain.Optimism]: ["https://optimism.llamarpc.com", "https://1rpc.io/op"],
  [Chain.Polkadot]: ["wss://polkadot-rpc.dwellir.com", "wss://polkadot.api.onfinality.io/public-ws"],
  [Chain.Polygon]: ["https://polygon.llamarpc.com", "https://polygon-bor-rpc.publicnode.com"],
  [Chain.Radix]: ["https://mainnet.radixdlt.com", "https://radix-mainnet.rpc.grove.city/v1"],
  [Chain.Ripple]: ["wss://s1.ripple.com/", "wss://s2.ripple.com/"],
  [Chain.THORChain]: ["https://thornode.ninerealms.com", NODE_URLS[Chain.THORChain]],
  [StagenetChain.THORChain]: [],
  [Chain.Solana]: ["https://api.mainnet-beta.solana.com", "https://solana-mainnet.rpc.extrnode.com"],
  [Chain.Tron]: ["https://api.tronstack.io", "https://api.tron.network"],
  [Chain.Zcash]: [],
};

export const EXPLORER_URLS: Record<Chain, string> = {
  [Chain.Arbitrum]: "https://arbiscan.io",
  [Chain.Aurora]: "https://explorer.mainnet.aurora.dev",
  [Chain.Avalanche]: "https://snowtrace.io",
  [Chain.Base]: "https://basescan.org",
  [Chain.Berachain]: "https://berascan.com",
  [Chain.BinanceSmartChain]: "https://bscscan.com",
  [Chain.Bitcoin]: "https://blockchair.com/bitcoin",
  [Chain.BitcoinCash]: "https://www.blockchair.com/bitcoin-cash",
  [Chain.Chainflip]: "https://explorer.polkascan.io/polkadot",
  [Chain.Cosmos]: "https://www.mintscan.io/cosmos",
  [Chain.Dash]: "https://blockchair.com/dash",
  [Chain.Dogecoin]: "https://blockchair.com/dogecoin",
  [Chain.Ethereum]: "https://etherscan.io",
  [Chain.Fiat]: "",
  [Chain.Gnosis]: "https://gnosisscan.io",
  [Chain.Kujira]: "https://finder.kujira.network/kaiyo-1",
  [Chain.Litecoin]: "https://blockchair.com/litecoin",
  [Chain.Maya]: "https://www.mayascan.org",
  [Chain.Near]: "https://nearblocks.io",
  [Chain.Noble]: "https://www.mintscan.io/noble",
  [Chain.Optimism]: "https://optimistic.etherscan.io",
  [Chain.Polkadot]: "https://polkadot.subscan.io",
  [Chain.Polygon]: "https://polygonscan.com",
  [Chain.Radix]: "https://dashboard.radixdlt.com",
  [Chain.Ripple]: "https://livenet.xrpl.org/",
  [Chain.THORChain]: "https://runescan.io",
  [Chain.Solana]: "https://solscan.io",
  [Chain.Tron]: "https://tronscan.org",
  [Chain.Zcash]: "https://blockchair.com/zcash",
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
