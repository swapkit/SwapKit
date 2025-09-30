import { Chain, getChainConfig, StagenetChain } from "@swapkit/types";

/**
 * Note: RPC_URLS will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const rpcUrl = RPC_URLS[Chain.Ethereum];
 * +const { rpcUrls: [rpcUrl] } = getChainConfig(Chain.Ethereum);
 * ```
 */
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
  [Chain.Gnosis]: "https://gnosis-rpc.publicnode.com",
  // WIP - might change
  [Chain.Harbor]: getChainConfig(Chain.Harbor).rpcUrl,
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
  [Chain.THORChain]: "https://rpc.ninerealms.com",
  [Chain.Tron]: "https://tron-rpc.publicnode.com",
  [Chain.Zcash]:
    "https://api.tatum.io/v3/blockchain/node/zcash-mainnet/t-6894a2ae7fc90cccfd3ce71b-2fce88aa7f4a41a5b1e93874",
  [StagenetChain.Maya]: "",
  [StagenetChain.THORChain]: "https://stagenet-rpc.ninerealms.com",
  // WIP - might change
  [StagenetChain.Harbor]: getChainConfig(Chain.Harbor).rpcUrl,
};

export const NODE_URLS = {
  [Chain.THORChain]: "https://thornode.ninerealms.com",
  [Chain.Maya]: "https://mayanode.mayachain.info",
  // WIP - might change
  [Chain.Harbor]: getChainConfig(Chain.Harbor).rpcUrl,
  [StagenetChain.THORChain]: "https://stagenet-thornode.ninerealms.com",
  [StagenetChain.Maya]: "https://stagenet.mayanode.mayachain.info",
};

/**
 * Note: FALLBACK_URLS has been removed in favor of supporting multiple RPC URLs.
 * This export will be discontinued in future versions.
 */
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
  [Chain.Gnosis]: ["https://gnosis.drpc.org", "https://rpc.ankr.com/gnosis"],
  [Chain.Harbor]: [],
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
  [StagenetChain.Harbor]: [],
  [Chain.Solana]: ["https://api.mainnet-beta.solana.com", "https://solana-mainnet.rpc.extrnode.com"],
  [Chain.Tron]: ["https://api.tronstack.io", "https://api.tron.network"],
  [Chain.Zcash]: [],
};

/**
 * Note: EXPLORER_URLS will be discontinued in future versions.
 * Please use getChainConfig instead.
 * @example
 * ```diff
 * -const explorerUrl = EXPLORER_URLS[Chain.Ethereum];
 * +const { blockExplorerUrl } = getChainConfig(Chain.Ethereum);
 * ```
 */
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
  [Chain.Gnosis]: "https://gnosisscan.io",
  [Chain.Harbor]: "",
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
