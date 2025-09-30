import { createChain } from "./_createChain";
import { Chain, ChainId } from "./_enums";

const BTC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/bitcoin",
  blockTime: 600,
  chain: Chain.Bitcoin,
  chainId: ChainId.Bitcoin,
  explorerUrl: "https://blockchair.com/bitcoin",
  name: "Bitcoin",
  nativeCurrency: "BTC",
  rpcUrl: "https://bitcoin-rpc.publicnode.com",
  type: "utxo",
});

const BCH = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.blockchair.com/bitcoin-cash",
  blockTime: 600,
  chain: Chain.BitcoinCash,
  chainId: ChainId.BitcoinCash,
  explorerUrl: "https://www.blockchair.com/bitcoin-cash",
  name: "BitcoinCash",
  nativeCurrency: "BCH",
  rpcUrl: "https://node-router.thorswap.net/bitcoin-cash",
  type: "utxo",
});

const LTC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/litecoin",
  blockTime: 150,
  chain: Chain.Litecoin,
  chainId: ChainId.Litecoin,
  explorerUrl: "https://blockchair.com/litecoin",
  name: "Litecoin",
  nativeCurrency: "LTC",
  rpcUrl: "https://node-router.thorswap.net/litecoin",
  type: "utxo",
});

const DOGE = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/dogecoin",
  blockTime: 600,
  chain: Chain.Dogecoin,
  chainId: ChainId.Dogecoin,
  explorerUrl: "https://blockchair.com/dogecoin",
  name: "Dogecoin",
  nativeCurrency: "DOGE",
  rpcUrl: "https://node-router.thorswap.net/dogecoin",
  type: "utxo",
});

const DASH = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/dash",
  blockTime: 150,
  chain: Chain.Dash,
  chainId: ChainId.Dash,
  explorerUrl: "https://blockchair.com/dash",
  name: "Dash",
  nativeCurrency: "DASH",
  rpcUrl: "https://dash-rpc.publicnode.com",
  type: "utxo",
});

const ZEC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/zcash",
  blockTime: 150,
  chain: Chain.Zcash,
  chainId: ChainId.Zcash,
  explorerUrl: "https://blockchair.com/zcash",
  name: "Zcash",
  nativeCurrency: "ZEC",
  rpcUrl: "https://api.tatum.io/v3/blockchain/node/zcash-mainnet/t-6894a2ae7fc90cccfd3ce71b-2fce88aa7f4a41a5b1e93874",
  type: "utxo",
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
