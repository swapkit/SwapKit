import { Chain, ChainToExplorerUrl } from "@swapkit/helpers";
import { match } from "ts-pattern";

export function getExplorerTxUrl({ chain, txHash }: { txHash: string; chain: Chain }) {
  const baseUrl = ChainToExplorerUrl[chain];

  const explorerUrl = match(chain)
    .with(
      Chain.Maya,
      Chain.Kujira,
      Chain.Cosmos,
      Chain.THORChain,
      Chain.Solana,
      () => `${baseUrl}/tx/${txHash.startsWith("0x") ? txHash.slice(2) : txHash}`,
    )
    .with(
      Chain.Arbitrum,
      Chain.Avalanche,
      Chain.BinanceSmartChain,
      Chain.Base,
      Chain.Ethereum,
      Chain.Optimism,
      Chain.Polkadot,
      Chain.Polygon,
      () => `${baseUrl}/tx/${txHash.startsWith("0x") ? txHash : `0x${txHash}`}`,
    )
    .with(
      Chain.Litecoin,
      Chain.Bitcoin,
      Chain.BitcoinCash,
      Chain.Dogecoin,
      Chain.Radix,
      () => `${baseUrl}/transaction/${txHash.toLowerCase()}`,
    )
    .with(Chain.Near, () => `${baseUrl}/txns/${txHash}`)
    .otherwise(() => "");

  return explorerUrl;
}

export function getExplorerAddressUrl({ chain, address }: { address: string; chain: Chain }) {
  const baseUrl = ChainToExplorerUrl[chain];

  const explorerUrl = match(chain)
    .with(Chain.Solana, Chain.Radix, () => `${baseUrl}/account/${address}`)
    .otherwise(() => `${baseUrl}/address/${address}`);

  return explorerUrl;
}
