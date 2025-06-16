import { AssetValue, BaseDecimal, Chain, RequestClient, SwapKitNumber } from "@swapkit/helpers";
import type { MemberDetailsMayachain, MemberDetailsThorchain, THORNameDetails } from "./types";

function getMidgardBaseUrl(isThorchain = true) {
  return isThorchain ? "https://midgard.ninerealms.com" : "https://midgard.mayachain.info";
}

function getNameServiceBaseUrl(isThorchain = true) {
  const baseUrl = getMidgardBaseUrl(isThorchain);
  return isThorchain ? `${baseUrl}/v2/thorname` : `${baseUrl}/v2/mayaname`;
}

function getLiquidityPositionRaw<Chain extends Chain.THORChain | Chain.Maya>(baseUrl: string) {
  return function getLiquidityPosition(
    address: string,
  ): Promise<Chain extends Chain.THORChain ? MemberDetailsThorchain : MemberDetailsMayachain> {
    return RequestClient.get<
      Chain extends Chain.THORChain ? MemberDetailsThorchain : MemberDetailsMayachain
    >(`${baseUrl}/v2/member/${address}`);
  };
}

function getNameDetails(baseUrl: string) {
  return function getNameDetails(name: string) {
    return RequestClient.get<THORNameDetails>(`${baseUrl}/lookup/${name}`);
  };
}

function getNamesByAddress(baseUrl: string) {
  return function getNamesByAddress(address: string) {
    return RequestClient.get<string[]>(`${baseUrl}/rlookup/${address}`);
  };
}

function getNamesByOwner(baseUrl: string) {
  return function getNamesByOwner(address: string) {
    return RequestClient.get<string[]>(`${baseUrl}/owner/${address}`);
  };
}

function getPoolAsset({ asset, value }: { asset: string; value: string }) {
  return AssetValue.from({ asset, value, fromBaseDecimal: BaseDecimal.THOR });
}

function getLiquidityPosition<IsThorchain extends boolean = true>({
  liquidityPositionGetter,
  isThorchain,
}: {
  liquidityPositionGetter: ReturnType<
    typeof getLiquidityPositionRaw<IsThorchain extends true ? Chain.THORChain : Chain.Maya>
  >;
  isThorchain: IsThorchain;
}) {
  return async function getLiquidityPosition(address: string) {
    const rawLiquidityPositions = await liquidityPositionGetter(address);
    const fieldPrefix = isThorchain ? "rune" : "cacao";

    return rawLiquidityPositions.pools.map((p) => ({
      [`${fieldPrefix}Pending`]: getPoolAsset({ asset: "THOR.RUNE", value: p.runePending }),
      [`${fieldPrefix}RegisteredAddress`]: p.runeAddress,
      [`${fieldPrefix}Withdrawn`]: getPoolAsset({ asset: "THOR.RUNE", value: p.runeWithdrawn }),
      [fieldPrefix]: getPoolAsset({ asset: "THOR.RUNE", value: p.runeAdded }),
      asset: getPoolAsset({ asset: p.pool, value: p.assetAdded }),
      assetPending: getPoolAsset({ asset: p.pool, value: p.assetPending }),
      assetRegisteredAddress: p.assetAddress,
      assetWithdrawn: getPoolAsset({ asset: p.pool, value: p.assetWithdrawn }),
      dateFirstAdded: p.dateFirstAdded,
      dateLastAdded: p.dateLastAdded,
      poolShare: new SwapKitNumber(p.liquidityUnits).div(p.pool),
    }));
  };
}

function getMidgardMethodsForProtocol<T extends Chain.THORChain | Chain.Maya>(chain: T) {
  const isThorchain = chain === Chain.THORChain;
  const midgardBaseUrl = getMidgardBaseUrl(isThorchain);
  const nameServiceBaseUrl = getNameServiceBaseUrl(isThorchain);
  const liquidityPositionGetter = getLiquidityPositionRaw<T>(midgardBaseUrl);

  return {
    getLiquidityPositionRaw: liquidityPositionGetter,
    getNameDetails: getNameDetails(nameServiceBaseUrl),
    getNamesByAddress: getNamesByAddress(nameServiceBaseUrl),
    getNamesByOwner: getNamesByOwner(nameServiceBaseUrl),
    getLiquidityPosition: getLiquidityPosition({ liquidityPositionGetter, isThorchain }),
  };
}

export const thorchainMidgard = getMidgardMethodsForProtocol(Chain.THORChain);
export const mayachainMidgard = getMidgardMethodsForProtocol(Chain.Maya);
