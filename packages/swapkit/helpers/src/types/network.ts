import { Chain, StagenetChain } from "./chains";

/** @deprecated Use getRPCUrl or RPC_URLS instead */
export enum RPCUrl {
  Arbitrum = "https://arb1.arbitrum.io/rpc",
  Avalanche = "https://avalanche-c-chain-rpc.publicnode.com",
  Base = "https://base.llamarpc.com",
  BinanceSmartChain = "https://bsc-dataseed.binance.org",
  Bitcoin = "https://bitcoin-rpc.publicnode.com",
  BitcoinCash = "https://node-router.thorswap.net/bitcoin-cash",
  Chainflip = "wss://mainnet-archive.chainflip.io",
  Cosmos = "https://node-router.thorswap.net/cosmos/rpc",
  Dash = "https://dash-rpc.publicnode.com",
  Dogecoin = "https://node-router.thorswap.net/dogecoin",
  Ethereum = "https://ethereum-rpc.publicnode.com",
  Kujira = "https://rpc-kujira.synergynodes.com/",
  Litecoin = "https://node-router.thorswap.net/litecoin",
  Maya = "https://tendermint.mayachain.info",
  MayaStagenet = "https://stagenet.tendermint.mayachain.info",
  Optimism = "https://mainnet.optimism.io",
  Polkadot = "wss://rpc.polkadot.io",
  Polygon = "https://polygon-rpc.com",
  Radix = "https://radix-mainnet.rpc.grove.city/v1/326002fc/core",
  THORChain = "https://rpc.thorswap.net",
  THORChainStagenet = "https://stagenet-rpc.ninerealms.com",
  Solana = "https://solana-rpc.publicnode.com",
}

export let RPC_URLS: Record<Chain | StagenetChain, string> = {
  [Chain.Arbitrum]: "https://arb1.arbitrum.io/rpc",
  [Chain.Avalanche]: "https://avalanche-c-chain-rpc.publicnode.com",
  [Chain.Base]: "https://base.llamarpc.com",
  [Chain.BinanceSmartChain]: "https://bsc-dataseed.binance.org",
  [Chain.Bitcoin]: "https://bitcoin-rpc.publicnode.com",
  [Chain.BitcoinCash]: "https://node-router.thorswap.net/bitcoin-cash",
  [Chain.Chainflip]: "wss://mainnet-archive.chainflip.io",
  [Chain.Cosmos]: "https://node-router.thorswap.net/cosmos/rpc",
  [Chain.Dash]: "https://dash-rpc.publicnode.com",
  [Chain.Dogecoin]: "https://node-router.thorswap.net/dogecoin",
  [Chain.Ethereum]: "https://ethereum-rpc.publicnode.com",
  [Chain.Kujira]: "https://rpc-kujira.synergynodes.com/",
  [Chain.Litecoin]: "https://node-router.thorswap.net/litecoin",
  [Chain.Maya]: "https://tendermint.mayachain.info",
  [Chain.Optimism]: "https://mainnet.optimism.io",
  [Chain.Polkadot]: "wss://rpc.polkadot.io",
  [Chain.Polygon]: "https://polygon-rpc.com",
  [Chain.Radix]: "https://radix-mainnet.rpc.grove.city/v1/326002fc/core",
  [Chain.THORChain]: "https://rpc.thorswap.net",
  [StagenetChain.THORChain]: "https://stagenet-rpc.ninerealms.com",
  [StagenetChain.Maya]: "https://stagenet.tendermint.mayachain.info",
  [Chain.Solana]: "https://solana-rpc.publicnode.com",
};

export const getRPCUrl = (chain: Chain | StagenetChain) => {
  return RPC_URLS[chain];
};

const getRpcBody = (chain: Chain | StagenetChain) => {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon:
      return {
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      };
    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Litecoin:
      return {
        jsonrpc: "1.0",
        id: "test",
        method: "getblockchaininfo",
        params: [],
      };
    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Maya:
    case Chain.THORChain:
    case StagenetChain.Maya:
    case StagenetChain.THORChain:
      return {
        id: 1,
        jsonrpc: "2.0",
        method: "status",
        params: {},
      };
    case Chain.Polkadot:
      return {
        jsonrpc: "2.0",
        id: 1,
        method: "system_health",
        params: [],
      };
    case Chain.Radix:
      return "";
    case Chain.Solana:
      return {
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      };
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};

function getChainStatusEndpoint(chain: Chain | StagenetChain) {
  switch (chain) {
    case Chain.Radix:
      return "/status/network-configuration";
    default:
      return "";
  }
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

  RPC_URLS = { ...RPC_URLS, ...workingUrls };
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
  [Chain.Ethereum]: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
  [Chain.Kujira]: ["https://kujira-rpc.polkachu.com", "https://kujira-rpc.ibs.team"],
  [Chain.Litecoin]: ["https://ltc.getblock.io/mainnet", "https://litecoin.publicnode.com"],
  [Chain.Maya]: ["https://tendermint.mayachain.info", "https://maya-tendermint.publicnode.com"],
  [StagenetChain.Maya]: [],
  [Chain.Optimism]: ["https://optimism.llamarpc.com", "https://1rpc.io/op"],
  [Chain.Polkadot]: [
    "wss://polkadot-rpc.dwellir.com",
    "wss://polkadot.api.onfinality.io/public-ws",
  ],
  [Chain.Polygon]: ["https://polygon.llamarpc.com", "https://rpc.ankr.com/polygon"],
  [Chain.Radix]: ["https://mainnet.radixdlt.com", "https://radix-mainnet.rpc.grove.city/v1"],
  [Chain.THORChain]: ["https://thornode.ninerealms.com", "https://thornode.thorswap.net"],
  [StagenetChain.THORChain]: [],
  [Chain.Solana]: ["https://api.mainnet-beta.solana.com", "https://rpc.ankr.com/solana"],
};

/** @deprecated Use EXPLORER_URLS instead */
export enum ExplorerUrl {
  Arbitrum = "https://arbiscan.io",
  Avalanche = "https://snowtrace.io",
  Base = "https://basescan.org",
  BinanceSmartChain = "https://bscscan.com",
  Bitcoin = "https://blockchair.com/bitcoin",
  BitcoinCash = "https://www.blockchair.com/bitcoin-cash",
  Chainflip = "https://explorer.polkascan.io/polkadot",
  Cosmos = "https://www.mintscan.io/cosmos",
  Dash = "https://blockchair.com/dash",
  Dogecoin = "https://blockchair.com/dogecoin",
  Ethereum = "https://etherscan.io",
  Kujira = "https://finder.kujira.network/kaiyo-1",
  Litecoin = "https://blockchair.com/litecoin",
  Maya = "https://www.mayascan.org",
  Optimism = "https://optimistic.etherscan.io",
  Polkadot = "https://polkadot.subscan.io",
  Polygon = "https://polygonscan.com",
  Radix = "https://dashboard.radixdlt.com",
  THORChain = "https://runescan.io",
  Solana = "https://solscan.io",
}

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
  [Chain.Kujira]: "https://finder.kujira.network/kaiyo-1",
  [Chain.Litecoin]: "https://blockchair.com/litecoin",
  [Chain.Maya]: "https://www.mayascan.org",
  [Chain.Optimism]: "https://optimistic.etherscan.io",
  [Chain.Polkadot]: "https://polkadot.subscan.io",
  [Chain.Polygon]: "https://polygonscan.com",
  [Chain.Radix]: "https://dashboard.radixdlt.com",
  [Chain.THORChain]: "https://runescan.io",
  [Chain.Solana]: "https://solscan.io",
};
