import { Chain, type EVMChain, getChainConfig, getRPCUrl, type NetworkParams } from "@swapkit/helpers";
import { match } from "ts-pattern";

export async function getProvider(chain: EVMChain, customUrl?: string) {
  const { JsonRpcProvider } = await import("ethers");

  return new JsonRpcProvider(customUrl || (await getRPCUrl(chain)));
}

export function toHexString(value: bigint) {
  return value > 0n ? `0x${value.toString(16)}` : "0x0";
}

export function getNetworkParams<C extends EVMChain>(chain: C) {
  const { explorerUrl, chainId, rpcUrls } = getChainConfig(chain);

  return () =>
    (chain === Chain.Ethereum
      ? undefined
      : {
          ...getNetworkInfo({ chain }),
          blockExplorerUrls: [explorerUrl],
          chainId,
          rpcUrls,
        }) as C extends typeof Chain.Ethereum ? undefined : NetworkParams;
}

export function getIsEIP1559Compatible<C extends EVMChain>(chain: C) {
  const notCompatible = [Chain.Arbitrum, Chain.BinanceSmartChain] as EVMChain[];

  return !notCompatible.includes(chain);
}

function getNetworkInfo({ chain }: { chain: EVMChain }) {
  const { name, nativeCurrency, baseDecimal: decimals } = getChainConfig(chain);

  return match(chain)
    .with(Chain.Arbitrum, () => ({
      chainName: "Arbitrum One",
      nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum },
    }))
    .with(Chain.Aurora, () => ({
      chainName: "Aurora Mainnet",
      nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum },
    }))
    .with(Chain.Avalanche, () => ({
      chainName: "Avalanche Network",
      nativeCurrency: { decimals, name: "Avalanche", symbol: chain },
    }))
    .with(Chain.Base, () => ({
      chainName: "Base Mainnet",
      nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum },
    }))
    .with(Chain.Berachain, () => ({
      chainName: "Berachain",
      nativeCurrency: { decimals, name: "Berachain", symbol: "BERA" },
    }))
    .with(Chain.XLayer, () => ({ chainName: "X Layer", nativeCurrency: { decimals, name: "OKB", symbol: "OKB" } }))
    .with(Chain.BinanceSmartChain, () => ({
      chainName: "BNB Smart Chain Mainnet",
      nativeCurrency: { decimals, name: "Binance Coin", symbol: "BNB" },
    }))
    .with(Chain.Gnosis, () => ({ chainName: "Gnosis", nativeCurrency: { decimals, name: "xDAI", symbol: "XDAI" } }))
    .with(Chain.Optimism, () => ({
      chainName: "OP Mainnet",
      nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum },
    }))
    .with(Chain.Polygon, () => ({
      chainName: "Polygon Mainnet",
      nativeCurrency: { decimals, name: "Polygon", symbol: Chain.Polygon },
    }))
    .otherwise(() => ({ chainName: name, nativeCurrency: { decimals, name: nativeCurrency, symbol: nativeCurrency } }));
}
