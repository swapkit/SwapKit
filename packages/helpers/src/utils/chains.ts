import { match } from "ts-pattern";
import { SKConfig } from "../modules/swapKitConfig";
import { SwapKitError } from "../modules/swapKitError";
import { Chain, StagenetChain } from "../types/chains";
import { warnOnce } from "./others";

function getRpcBody(chain: Chain | StagenetChain) {
  return match(chain)
    .with(
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
      () => ({ id: 1, jsonrpc: "2.0", method: "eth_blockNumber", params: [] }),
    )
    .with(
      Chain.Bitcoin,
      Chain.Dogecoin,
      Chain.BitcoinCash,
      Chain.Dash,
      Chain.Litecoin,
      Chain.Zcash,
      () => ({
        id: "test",
        jsonrpc: "1.0",
        method: "getblockchaininfo",
        params: [],
      }),
    )
    .with(
      Chain.Cosmos,
      Chain.Kujira,
      Chain.Noble,
      Chain.Maya,
      Chain.THORChain,
      StagenetChain.Maya,
      StagenetChain.THORChain,
      () => ({ id: 1, jsonrpc: "2.0", method: "status", params: {} }),
    )
    .with(Chain.Polkadot, Chain.Chainflip, () => ({
      id: 1,
      jsonrpc: "2.0",
      method: "system_health",
      params: [],
    }))
    .with(Chain.Solana, () => ({ id: 1, jsonrpc: "2.0", method: "getHealth" }))
    .with(Chain.Tron, Chain.Radix, Chain.Fiat, () => "")
    .with(Chain.Near, () => ({
      jsonrpc: "2.0",
      id: "dontcare",
      method: "status",
      params: [],
    }))
    .with(Chain.Ripple, () => ({
      method: "ping",
      params: [{}],
      id: 1,
      jsonrpc: "2.0",
    }))
    .otherwise(() => {
      throw new SwapKitError("helpers_chain_not_supported", { chain });
    });
}

function getChainStatusEndpoint(chain: Chain | StagenetChain) {
  return match(chain)
    .with(Chain.Radix, () => "/status/network-configuration")
    .with(Chain.Tron, () => "/wallet/getnowblock")
    .otherwise(() => "");
}

async function testRPCConnection(chain: Chain | StagenetChain, url: string) {
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
}

const rpcCache = new Map<Chain | StagenetChain, { timestamp: number; url: string }>();
const rpcCacheTTL = 1000 * 60 * 2; // 2 minutes

export async function getRPCUrl(chain: Chain | StagenetChain) {
  const { isStagenet } = SKConfig.get("envs");
  const rpcUrls = SKConfig.get("rpcUrls");
  const fallbackUrls = SKConfig.get("fallbackRpcUrls");

  if (isStagenet) {
    return rpcUrls[chain];
  }

  const cached = rpcCache.get(chain);
  if (cached && Date.now() - cached.timestamp < rpcCacheTTL) {
    return cached.url;
  }

  const primaryUrl = rpcUrls[chain];
  const primaryIsWorking = await testRPCConnection(chain, primaryUrl);

  if (!primaryIsWorking) {
    for (const fallbackUrl of fallbackUrls[chain]) {
      const fallbackIsWorking = await testRPCConnection(chain, fallbackUrl);

      if (fallbackIsWorking) {
        rpcCache.set(chain, { timestamp: Date.now(), url: fallbackUrl });
        return fallbackUrl;
      }
    }
  }

  rpcCache.set(chain, { timestamp: Date.now(), url: primaryUrl });
  return primaryUrl;
}

/**
 * @deprecated
 * RPC URLs are now managed dynamically via SKConfig.
 * Please use static { rpcUrls, fallbackRpcUrls } SwapKit init config or dynamic SKConfig.setRpcUrl/setFallbackRpcUrl to configure RPC endpoints.
 * This function is obsolete and will be removed in a future release.
 */
export function initializeRPCUrlsWithFallback(_chains: never) {
  warnOnce({
    condition: true,
    id: "initializeRPCUrlsWithFallback",
    warning:
      "initializeRPCUrlsWithFallback is deprecated. Use static { rpcUrls, fallbackRpcUrls } SwapKit init config or dynamic SKConfig.setRpcUrl/setFallbackRpcUrl to configure RPC endpoints.",
  });
}
