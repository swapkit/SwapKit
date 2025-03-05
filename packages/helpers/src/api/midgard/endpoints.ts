import { AssetValue, BaseDecimal, Chain, RequestClient, SwapKitNumber } from "@swapkit/helpers";
import type {
  BorrowerDetails,
  MemberDetailsMayachain,
  MemberDetailsThorchain,
  SaverDetails,
  THORNameDetails,
} from "./types";

function getMidgardBaseUrl(isThorchain = true) {
  return isThorchain ? "https://midgard.ninerealms.com" : "https://midgard.mayachain.info";
}

function getNameServiceBaseUrl(isThorchain = true) {
  const baseUrl = getMidgardBaseUrl(isThorchain);
  return isThorchain ? `${baseUrl}/v2/thorname` : `${baseUrl}/v2/mayaname`;
}

function getBorrowerDetailRaw(baseUrl: string) {
  return function getBorrowerDetail(address: string) {
    return RequestClient.get<BorrowerDetails>(`${baseUrl}/v2/borrower/${address}`);
  };
}

function getSaverDetailRaw(baseUrl: string) {
  return function getSaverDetail(address: string) {
    return RequestClient.get<SaverDetails>(`${baseUrl}/v2/saver/${address}`);
  };
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
    return RequestClient.get<THORNameDetails>(`${baseUrl}/rlookup/${address}`);
  };
}

function getNamesByOwner(baseUrl: string) {
  return function getNamesByOwner(address: string) {
    return RequestClient.get<THORNameDetails>(`${baseUrl}/owner/${address}`);
  };
}

function getBorrowerDetail(borrowerDetailGetter: ReturnType<typeof getBorrowerDetailRaw>) {
  return async function getBorrowerDetail(address: string) {
    const rawBorrowerDetail = await borrowerDetailGetter(address);

    return rawBorrowerDetail.pools.map((p) => ({
      collateral_deposited: AssetValue.from({
        asset: p.collateral_asset,
        value: p.collateral_deposited,
        fromBaseDecimal: BaseDecimal.THOR,
      }),
      collateral_withdrawn: AssetValue.from({
        asset: p.collateral_asset,
        value: p.collateral_withdrawn,
        fromBaseDecimal: BaseDecimal.THOR,
      }),
      debt_issued_tor: SwapKitNumber.fromBigInt(BigInt(p.debt_issued_tor), BaseDecimal.THOR),
      debt_repaid_tor: SwapKitNumber.fromBigInt(BigInt(p.debt_repaid_tor), BaseDecimal.THOR),
      last_open_loan_timestamp: p.last_open_loan_timestamp,
      last_repay_loan_timestamp: p.last_repay_loan_timestamp,
      target_assets: p.target_assets.map((asset) => AssetValue.from({ asset })),
    }));
  };
}

function getPoolAsset({ asset, value }: { asset: string; value: string }) {
  return AssetValue.from({ asset, value, fromBaseDecimal: BaseDecimal.THOR });
}

function getSaverDetail(saverDetailGetter: ReturnType<typeof getSaverDetailRaw>) {
  return async function getSaverDetail(address: string) {
    const rawSaverPositions = await saverDetailGetter(address);

    return rawSaverPositions.pools.map((p) => ({
      assetAdded: getPoolAsset({ asset: p.pool, value: p.assetAdded }),
      assetDeposit: getPoolAsset({ asset: p.pool, value: p.assetDeposit }),
      assetRedeem: getPoolAsset({ asset: p.pool, value: p.assetRedeem }),
      assetWithdrawn: getPoolAsset({ asset: p.pool, value: p.assetWithdrawn }),
      assetRegisteredAddress: p.assetAddress,
      dateFirstAdded: p.dateFirstAdded,
      dateLastAdded: p.dateLastAdded,
    }));
  };
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
  const borrowerDetailGetter = getBorrowerDetailRaw(midgardBaseUrl);
  const saverDetailGetter = getSaverDetailRaw(midgardBaseUrl);

  return {
    getLiquidityPositionRaw: liquidityPositionGetter,
    getBorrowerDetailRaw: borrowerDetailGetter,
    getSaverDetailRaw: saverDetailGetter,
    getBorrowerDetail: getBorrowerDetail(borrowerDetailGetter),
    getSaversDetail: getSaverDetail(saverDetailGetter),
    getNameDetails: getNameDetails(nameServiceBaseUrl),
    getNamesByAddress: getNamesByAddress(nameServiceBaseUrl),
    getNamesByOwner: getNamesByOwner(nameServiceBaseUrl),
    getLiquidityPosition: getLiquidityPosition({ liquidityPositionGetter, isThorchain }),
  };
}

export const thorchainMidgard = getMidgardMethodsForProtocol(Chain.THORChain);
export const mayachainMidgard = getMidgardMethodsForProtocol(Chain.Maya);
