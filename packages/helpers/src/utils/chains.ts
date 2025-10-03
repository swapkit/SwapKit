import { Chain, CosmosChains, EVMChains, type StagenetChain, StagenetChains, UTXOChains } from "@swapkit/types";
import { match } from "ts-pattern";
import { SKConfig } from "../modules/swapKitConfig";
import { SwapKitError } from "../modules/swapKitError";
import { warnOnce } from "./others";

function getRpcBody(chain: Chain | StagenetChain) {
  return match(chain)
    .with(...EVMChains, () => ({ id: 1, jsonrpc: "2.0", method: "eth_blockNumber", params: [] }))
    .with(...UTXOChains, () => ({ id: "test", jsonrpc: "1.0", method: "getblockchaininfo", params: [] }))
    .with(...CosmosChains, ...StagenetChains, () => ({ id: 1, jsonrpc: "2.0", method: "status", params: {} }))
    .with(Chain.Polkadot, Chain.Chainflip, () => ({ id: 1, jsonrpc: "2.0", method: "system_health", params: [] }))
    .with(Chain.Solana, () => ({ id: 1, jsonrpc: "2.0", method: "getHealth" }))
    .with(Chain.Sui, () => ({ id: 1, jsonrpc: "2.0", method: "sui_getSystemState", params: [] }))
    .with(Chain.Ton, () => ({ id: 1, jsonrpc: "2.0", method: "getAddressInformation", params: { address: "" } }))
    .with(Chain.Tron, Chain.Radix, () => "")
    .with(Chain.Near, () => ({ id: "dontcare", jsonrpc: "2.0", method: "status", params: [] }))
    .with(Chain.Ripple, () => ({ id: 1, jsonrpc: "2.0", method: "ping", params: [{}] }))
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
      body: JSON.stringify(getRpcBody(chain)),
      headers: { "Content-Type": "application/json" },
      method: "POST",
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
  const [rpcUrl = "", ...fallbackUrls] = SKConfig.get("rpcUrls")[chain];

  if (!rpcUrl) {
    warnOnce({
      condition: true,
      id: "helpers_chain_no_public_or_set_rpc_url",
      warning: `No public or set RPC URL found for chain. Please ensure you configured rpcUrls for ${chain}.`,
    });
    throw new SwapKitError("helpers_chain_no_public_or_set_rpc_url", { chain });
  }

  if (isStagenet) return rpcUrl;

  const cached = rpcCache.get(chain);
  if (cached && Date.now() - cached.timestamp < rpcCacheTTL) {
    return cached.url;
  }

  const primaryIsWorking = await testRPCConnection(chain, rpcUrl);

  if (!primaryIsWorking) {
    for (const fallbackUrl of fallbackUrls) {
      const fallbackIsWorking = await testRPCConnection(chain, fallbackUrl);

      if (fallbackIsWorking) {
        rpcCache.set(chain, { timestamp: Date.now(), url: fallbackUrl });
        return fallbackUrl;
      }
    }
  }

  rpcCache.set(chain, { timestamp: Date.now(), url: rpcUrl });
  return rpcUrl;
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
