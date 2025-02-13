import { AssetValue, BaseDecimal, Chain, RequestClient, SwapKitNumber } from "@swapkit/helpers";
import type {
  BorrowerDetails,
  MemberDetailsMayachain,
  MemberDetailsThorchain,
  SaverDetails,
  THORNameDetails,
} from "./types";

// TODO: question: Move to SKConfig under midgardUrls
// also - shouldn't that be named `isThorchain`?
// As we default to TC and this is the only place that checks for opposite
function getMidgardBaseUrl(isMayachain = false) {
  return isMayachain ? "https://midgard.mayachain.info" : "https://midgard.ninerealms.com";
}

function getNameServiceBaseUrl(isMayachain = false) {
  return isMayachain
    ? `${getMidgardBaseUrl(isMayachain)}/v2/mayaname`
    : `${getMidgardBaseUrl(isMayachain)}/v2/thorname`;
}

export function getBorrowerDetailRaw(address: string, isMayachain = false) {
  return RequestClient.get<BorrowerDetails>(
    `${getMidgardBaseUrl(isMayachain)}/v2/borrower/${address}`,
  );
}

export function getSaverDetailRaw(address: string, isMayachain = false) {
  return RequestClient.get<SaverDetails>(`${getMidgardBaseUrl(isMayachain)}/v2/saver/${address}`);
}

export function getLiquidityPositionRaw<T extends boolean = false>(
  address: string,
  isMayachain?: T,
) {
  return RequestClient.get<T extends true ? MemberDetailsMayachain : MemberDetailsThorchain>(
    `${getMidgardBaseUrl(isMayachain)}/v2/member/${address}`,
  );
}

export function getNameDetails(name: string, isMayachain = false) {
  return RequestClient.get<THORNameDetails>(`${getNameServiceBaseUrl(isMayachain)}/lookup/${name}`);
}

export function getNamesByAddress(address: string, isMayachain = false) {
  return RequestClient.get<THORNameDetails>(
    `${getNameServiceBaseUrl(isMayachain)}/rlookup/${address}`,
  );
}

export function getNamesByOwner(address: string, isMayachain = false) {
  return RequestClient.get<THORNameDetails>(
    `${getNameServiceBaseUrl(isMayachain)}/owner/${address}`,
  );
}

export async function getBorrowerDetail(address: string, isMayachain = false) {
  const rawBorrowerDetail = await getBorrowerDetailRaw(address, isMayachain);

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
}

export async function getSaverDetail(address: string, isMayachain = false) {
  const rawSaverPositions = await getSaverDetailRaw(address, isMayachain);

  return rawSaverPositions.pools.map((p) => ({
    assetRegisteredAddress: p.assetAddress,
    assetAdded: AssetValue.from({
      asset: p.pool,
      value: p.assetAdded,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    assetDeposit: AssetValue.from({
      asset: p.pool,
      value: p.assetDeposit,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    assetRedeem: AssetValue.from({
      asset: p.pool,
      value: p.assetRedeem,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    assetWithdrawn: AssetValue.from({
      asset: p.pool,
      value: p.assetWithdrawn,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    dateLastAdded: p.dateLastAdded,
    dateFirstAdded: p.dateFirstAdded,
  }));
}

export async function getLiquidityPosition(address: string, isMayachain = false) {
  const rawLiquidityPositions = await getLiquidityPositionRaw(address, isMayachain);

  return rawLiquidityPositions.pools.map((p) => ({
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
    [`${isMayachain ? "cacao" : "rune"}RegisteredAddress`]: p.runeAddress,
    [`${isMayachain ? "cacao" : "rune"}`]: AssetValue.from({
      asset: "THOR.RUNE",
      value: p.runeAdded,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    [`${isMayachain ? "cacao" : "rune"}Pending`]: AssetValue.from({
      asset: "THOR.RUNE",
      value: p.runePending,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    [`${isMayachain ? "cacao" : "rune"}Withdrawn`]: AssetValue.from({
      asset: "THOR.RUNE",
      value: p.runeWithdrawn,
      fromBaseDecimal: BaseDecimal.THOR,
    }),
    poolShare: new SwapKitNumber(p.liquidityUnits).div(p.pool),
    dateLastAdded: p.dateLastAdded,
    dateFirstAdded: p.dateFirstAdded,
  }));
}

const getMidgardMethodsForProtocol = (chain: Chain.THORChain | Chain.Maya) => ({
  getBorrowerDetail: (address: string) => getBorrowerDetail(address, chain === Chain.Maya),
  getBorrowerDetailRaw: (address: string) => getBorrowerDetailRaw(address, chain === Chain.Maya),
  getSaversDetail: (address: string) => getSaverDetail(address, chain === Chain.Maya),
  getSaverDetailRaw: (address: string) => getSaverDetailRaw(address, chain === Chain.Maya),
  getLiquidityPosition: (address: string) => getLiquidityPosition(address, chain === Chain.Maya),
  getLiquidityPositionRaw: (address: string) =>
    getLiquidityPositionRaw(address, chain === Chain.Maya),
  getNameDetails: (name: string) => getNameDetails(name, chain === Chain.Maya),
  getNamesByAddress: (address: string) => getNamesByAddress(address, chain === Chain.Maya),
  getNamesByOwner: (address: string) => getNamesByOwner(address, chain === Chain.Maya),
});

export const thorchainMidgard = getMidgardMethodsForProtocol(Chain.THORChain);
export const mayachainMidgard = getMidgardMethodsForProtocol(Chain.Maya);
