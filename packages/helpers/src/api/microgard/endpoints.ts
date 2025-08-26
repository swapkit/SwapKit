import { AssetValue, getChainConfig, RequestClient, SwapKitNumber } from "@swapkit/helpers";
import { Chain } from "@swapkit/types";
import type { LiquidityPositionRaw, MicroguardTHORNameDetails, PoolDetail, PoolPeriod } from "./types";

/**
 * TODO: Move to SKConfig under midgardUrls.microgard
 */
const baseUrl = "https://mu.thorswap.net";

export function getTHORNameDetails(thorname: string) {
  return RequestClient.get<MicroguardTHORNameDetails>(`${baseUrl}/thorname/lookup/${thorname}`);
}

export function getTHORNamesByOwner(owner: string) {
  return RequestClient.get<string[]>(`${baseUrl}/thorname/owner/${owner}`);
}

export function getTHORNamesByAddress(address: string) {
  return RequestClient.get<string[]>(`${baseUrl}/thorname/address/${address}`);
}

export function getTHORChainPools(period: PoolPeriod) {
  return RequestClient.get<PoolDetail[]>(`${baseUrl}/pools`, { searchParams: { period } });
}

export function getLiquidityPositionsRaw(addresses: string[]) {
  return RequestClient.get<LiquidityPositionRaw[]>(`${baseUrl}/fullmember?address=${addresses.join(",")}`);
}

export async function getTNSChainAddress({ chain, tns }: { chain: Chain; tns: string }) {
  const tnsDetails = await getTHORNameDetails(tns);

  return tnsDetails?.entries?.find((e) => e.chain.toLowerCase() === chain.toLowerCase())?.address;
}

export async function getLiquidityPositions(addresses: string[]) {
  const rawLiquidityPositions = await getLiquidityPositionsRaw(addresses);
  const fromBaseDecimal = getChainConfig(Chain.THORChain).baseDecimal;

  return rawLiquidityPositions.map((p) => ({
    asset: AssetValue.from({ asset: p.pool, fromBaseDecimal, value: p.assetAdded }),
    assetPending: AssetValue.from({ asset: p.pool, fromBaseDecimal, value: p.assetPending }),
    assetRegisteredAddress: p.assetAddress,
    assetWithdrawn: AssetValue.from({ asset: p.pool, fromBaseDecimal, value: p.assetWithdrawn }),
    dateFirstAdded: p.dateFirstAdded,
    dateLastAdded: p.dateLastAdded,
    poolShare: new SwapKitNumber(p.sharedUnits).div(p.poolUnits),
    rune: AssetValue.from({ asset: "THOR.RUNE", fromBaseDecimal, value: p.runeAdded }),
    runePending: AssetValue.from({ asset: "THOR.RUNE", fromBaseDecimal, value: p.runePending }),
    runeRegisteredAddress: p.runeAddress,
    runeWithdrawn: AssetValue.from({ asset: "THOR.RUNE", fromBaseDecimal, value: p.runeWithdrawn }),
  }));
}
