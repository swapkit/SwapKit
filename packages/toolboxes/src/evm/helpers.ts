import { Chain, type EVMChain, getChainConfig, getRPCUrl, type NetworkParams, SwapKitError } from "@swapkit/helpers";

export async function getProvider(chain: EVMChain, customUrl?: string) {
  const { JsonRpcProvider } = await import("ethers");

  return new JsonRpcProvider(customUrl || (await getRPCUrl(chain)));
}

export function toHexString(value: bigint) {
  return value > 0n ? `0x${value.toString(16)}` : "0x0";
}

export function getNetworkParams<C extends EVMChain>(chain: C) {
  const { blockExplorerUrl, chainId, rpcUrl } = getChainConfig(chain);

  return () =>
    (chain === Chain.Ethereum
      ? undefined
      : {
          ...getNetworkInfo({ chain }),
          blockExplorerUrls: [blockExplorerUrl],
          chainId,
          rpcUrls: [rpcUrl],
        }) as C extends typeof Chain.Ethereum ? undefined : NetworkParams;
}

export function getIsEIP1559Compatible<C extends EVMChain>(chain: C) {
  const notCompatible = [Chain.Arbitrum, Chain.BinanceSmartChain] as EVMChain[];

  return !notCompatible.includes(chain);
}

function getNetworkInfo<C extends EVMChain>({ chain }: { chain: C }) {
  const { baseDecimal: decimals } = getChainConfig(chain);

  switch (chain) {
    case Chain.Arbitrum:
      return { chainName: "Arbitrum One", nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum } };
    case Chain.Aurora:
      return { chainName: "Aurora Mainnet", nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum } };
    case Chain.Avalanche:
      return { chainName: "Avalanche Network", nativeCurrency: { decimals, name: "Avalanche", symbol: chain } };
    case Chain.Base:
      return { chainName: "Base Mainnet", nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum } };
    case Chain.Berachain:
      return { chainName: "Berachain", nativeCurrency: { decimals, name: "Berachain", symbol: "BERA" } };
    case Chain.BinanceSmartChain:
      return {
        chainName: "BNB Smart Chain Mainnet",
        nativeCurrency: { decimals, name: "Binance Coin", symbol: "BNB" },
      };
    case Chain.Gnosis:
      return { chainName: "Gnosis", nativeCurrency: { decimals, name: "xDAI", symbol: "XDAI" } };
    case Chain.Optimism:
      return { chainName: "OP Mainnet", nativeCurrency: { decimals, name: "Ethereum", symbol: Chain.Ethereum } };
    case Chain.Polygon:
      return { chainName: "Polygon Mainnet", nativeCurrency: { decimals, name: "Polygon", symbol: Chain.Polygon } };
    default:
      throw new SwapKitError("toolbox_evm_not_supported", { chain });
  }
}
