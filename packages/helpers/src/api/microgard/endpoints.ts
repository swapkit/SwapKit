import { AssetValue, BaseDecimal, type Chain, RequestClient, SwapKitNumber } from "@swapkit/helpers";
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

  return rawLiquidityPositions.map((p) => ({
    asset: AssetValue.from({ asset: p.pool, fromBaseDecimal: BaseDecimal.THOR, value: p.assetAdded }),
    assetPending: AssetValue.from({ asset: p.pool, fromBaseDecimal: BaseDecimal.THOR, value: p.assetPending }),
    assetRegisteredAddress: p.assetAddress,
    assetWithdrawn: AssetValue.from({ asset: p.pool, fromBaseDecimal: BaseDecimal.THOR, value: p.assetWithdrawn }),
    dateFirstAdded: p.dateFirstAdded,
    dateLastAdded: p.dateLastAdded,
    poolShare: new SwapKitNumber(p.sharedUnits).div(p.poolUnits),
    rune: AssetValue.from({ asset: "THOR.RUNE", fromBaseDecimal: BaseDecimal.THOR, value: p.runeAdded }),
    runePending: AssetValue.from({ asset: "THOR.RUNE", fromBaseDecimal: BaseDecimal.THOR, value: p.runePending }),
    runeRegisteredAddress: p.runeAddress,
    runeWithdrawn: AssetValue.from({ asset: "THOR.RUNE", fromBaseDecimal: BaseDecimal.THOR, value: p.runeWithdrawn }),
  }));
}
