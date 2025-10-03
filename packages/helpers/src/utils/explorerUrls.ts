import { Chain, getChainConfig } from "@swapkit/types";
import { match } from "ts-pattern";

export function getExplorerTxUrl({ chain, txHash }: { txHash: string; chain: Chain }) {
  const { explorerUrl } = getChainConfig(chain);

  return match(chain)
    .with(
      Chain.Maya,
      Chain.Kujira,
      Chain.Noble,
      Chain.Cosmos,
      Chain.THORChain,
      Chain.Harbor,
      Chain.Solana,
      () => `${explorerUrl}/tx/${txHash.startsWith("0x") ? txHash.slice(2) : txHash}`,
    )
    .with(
      Chain.Arbitrum,
      Chain.Aurora,
      Chain.Avalanche,
      Chain.BinanceSmartChain,
      Chain.Base,
      Chain.Berachain,
      Chain.Ethereum,
      Chain.Gnosis,
      Chain.Optimism,
      Chain.Polkadot,
      Chain.Polygon,
      () => `${explorerUrl}/tx/${txHash.startsWith("0x") ? txHash : `0x${txHash}`}`,
    )
    .with(
      Chain.Litecoin,
      Chain.Bitcoin,
      Chain.BitcoinCash,
      Chain.Dogecoin,
      Chain.Zcash,
      Chain.Radix,
      Chain.Tron,
      () => `${explorerUrl}/transaction/${txHash.toLowerCase()}`,
    )
    .with(Chain.Near, () => `${explorerUrl}/txns/${txHash}`)
    .with(Chain.Ripple, () => `${explorerUrl}/transactions/${txHash}`)
    .with(Chain.Sui, () => `${explorerUrl}/txblock/${txHash}`)
    .with(Chain.Cardano, Chain.Ton, () => `${explorerUrl}/tx/${txHash}`)
    .otherwise(() => "");
}

export function getExplorerAddressUrl({ chain, address }: { address: string; chain: Chain }) {
  const { explorerUrl } = getChainConfig(chain);

  return match(chain)
    .with(Chain.Solana, Chain.Sui, Chain.Radix, () => `${explorerUrl}/account/${address}`)
    .otherwise(() => `${explorerUrl}/address/${address}`);
}
