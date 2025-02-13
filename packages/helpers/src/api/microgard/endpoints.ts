import {
  AssetValue,
  BaseDecimal,
  type Chain,
  RequestClient,
  SwapKitNumber,
} from "@swapkit/helpers";
import type { LiquidityPositionRaw, PoolDetail, PoolPeriod, THORNameDetails } from "./types";

/**
 * TODO: Move to SKConfig under midgardUrls.microgard
 */
const baseUrl = "https://mu.thorswap.net";

export function getTHORNameDetails(thorname: string) {
  return RequestClient.get<THORNameDetails>(`${baseUrl}/thorname/lookup/${thorname}`);
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
  return RequestClient.get<LiquidityPositionRaw[]>(
    `${baseUrl}/fullmember?address=${addresses.join(",")}`,
  );
}

export async function getTNSChainAddress({ chain, tns }: { chain: Chain; tns: string }) {
  const tnsDetails = await getTHORNameDetails(tns);

  return tnsDetails?.entries?.find((e) => e.chain.toLowerCase() === chain.toLowerCase())?.address;
}

export async function getLiquidityPositions(addresses: string[]) {
  const rawLiquidityPositions = await getLiquidityPositionsRaw(addresses);

  return rawLiquidityPositions.map((p) => ({
    assetRegisteredAddress: p.assetAddress,
    asset: AssetValue.from({
      asset: p.pool,
      value: p.assetAdded,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    assetPending: AssetValue.from({
      asset: p.pool,
      value: p.assetPending,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    assetWithdrawn: AssetValue.from({
      asset: p.pool,
      value: p.assetWithdrawn,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    runeRegisteredAddress: p.runeAddress,
    rune: AssetValue.from({
      asset: "THOR.RUNE",
      value: p.runeAdded,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    runePending: AssetValue.from({
      asset: "THOR.RUNE",
      value: p.runePending,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    runeWithdrawn: AssetValue.from({
      asset: "THOR.RUNE",
      value: p.runeWithdrawn,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    poolShare: new SwapKitNumber(p.sharedUnits).div(p.poolUnits),
    dateLastAdded: p.dateLastAdded,
    dateFirstAdded: p.dateFirstAdded,
  }));
}
