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
  Gnosis = "GNO",
  Harbor = "HARBOR",
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
  Harbor = "MAYA_HARBOR",
  THORChain = "THOR_STAGENET",
  Maya = "MAYA_STAGENET",
}

/**
 * ChainId enum - chain identifiers for different networks
 *
 * Note: Full-name properties (e.g., Arbitrum, Avalanche) will be discontinued in future versions.
 * Please use the short-handle properties (e.g., ARB, AVAX) instead.
 * The network configuration will be migrated to a more streamlined approach with one object per chain.
 */
export enum ChainId {
  // Full-name properties - will be discontinued in future versions
  // Please use the short-handle properties above (e.g., ARB instead of Arbitrum)
  Arbitrum = "42161",
  Aurora = "1313161554",
  Avalanche = "43114",
  Base = "8453",
  Berachain = "80094",
  BinanceSmartChain = "56",
  Bitcoin = "bitcoin",
  BitcoinCash = "bitcoincash",
  Chainflip = "chainflip",
  Cosmos = "cosmoshub-4",
  Dash = "dash",
  Dogecoin = "dogecoin",
  Ethereum = "1",
  Gnosis = "100",
  Harbor = "harbor-1",
  HarborStagenet = "harbor-stagenet-1",
  Kujira = "kaiyo-1",
  Litecoin = "litecoin",
  Maya = "mayachain-mainnet-v1",
  MayaStagenet = "mayachain-stagenet-v1",
  Near = "near",
  Noble = "noble-1",
  Optimism = "10",
  Polkadot = "polkadot",
  Polygon = "137",
  Radix = "radix-mainnet",
  Ripple = "ripple",
  THORChain = "thorchain-1",
  THORChainStagenet = "thorchain-stagenet-v2",
  Solana = "solana",
  Tron = "728126428",
  Zcash = "zcash",
}
