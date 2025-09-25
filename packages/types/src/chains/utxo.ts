import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const type = "utxo";

const BTC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/bitcoin",
  blockTime: 600,
  chain: Chain.Bitcoin,
  chainId: ChainId.BTC,
  explorerUrl: "https://blockchair.com/bitcoin",
  name: "Bitcoin",
  nativeCurrency: "BTC",
  networkDerivationPath: [84, 0, 0, 0, 0] as [number, number, number, number, number?],
  rpcUrls: ["https://bitcoin-rpc.publicnode.com", "https://bitcoin.publicnode.com"],
  type,
});

const BCH = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.blockchair.com/bitcoin-cash",
  blockTime: 600,
  chain: Chain.BitcoinCash,
  chainId: ChainId.BCH,
  explorerUrl: "https://www.blockchair.com/bitcoin-cash",
  name: "BitcoinCash",
  nativeCurrency: "BCH",
  networkDerivationPath: [44, 145, 0, 0, 0],
  rpcUrls: [
    "https://node-router.thorswap.net/bitcoin-cash",
    "https://bch-dataseed.binance.org",
    "https://bch.getblock.io/mainnet",
  ],
  type,
});

const LTC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/litecoin",
  blockTime: 150,
  chain: Chain.Litecoin,
  chainId: ChainId.LTC,
  explorerUrl: "https://blockchair.com/litecoin",
  name: "Litecoin",
  nativeCurrency: "LTC",
  networkDerivationPath: [84, 2, 0, 0, 0],
  rpcUrls: [
    "https://node-router.thorswap.net/litecoin",
    "https://ltc.getblock.io/mainnet",
    "https://litecoin.publicnode.com",
  ],
  type,
});

const DOGE = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/dogecoin",
  blockTime: 600,
  chain: Chain.Dogecoin,
  chainId: ChainId.DOGE,
  explorerUrl: "https://blockchair.com/dogecoin",
  name: "Dogecoin",
  nativeCurrency: "DOGE",
  networkDerivationPath: [44, 3, 0, 0, 0],
  rpcUrls: [
    "https://node-router.thorswap.net/dogecoin",
    "https://doge.getblock.io/mainnet",
    "https://dogecoin.publicnode.com",
  ],
  type,
});

const DASH = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/dash",
  blockTime: 150,
  chain: Chain.Dash,
  chainId: ChainId.DASH,
  explorerUrl: "https://blockchair.com/dash",
  name: "Dash",
  nativeCurrency: "DASH",
  networkDerivationPath: [44, 5, 0, 0, 0],
  rpcUrls: ["https://dash-rpc.publicnode.com", "https://dash.getblock.io/mainnet"],
  type,
});

const ZEC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/zcash",
  blockTime: 150,
  chain: Chain.Zcash,
  chainId: ChainId.ZEC,
  explorerUrl: "https://blockchair.com/zcash",
  name: "Zcash",
  nativeCurrency: "ZEC",
  networkDerivationPath: [44, 133, 0, 0, 0],
  rpcUrls: [
    "https://api.tatum.io/v3/blockchain/node/zcash-mainnet/t-6894a2ae7fc90cccfd3ce71b-2fce88aa7f4a41a5b1e93874",
  ],
  type,
});

export const UTXOChainConfigs = [BTC, BCH, LTC, DOGE, DASH, ZEC] as const;
export const UTXOChains = [
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
  Chain.Zcash,
] as const;
export type UTXOChain = (typeof UTXOChains)[number];
