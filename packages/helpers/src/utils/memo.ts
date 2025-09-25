import { Chain } from "@swapkit/types";
import { match } from "ts-pattern";
import { MemoType } from "../types/sdk";

export function getMemoForLeaveAndBond({ type, address }: BondOrLeaveParams) {
  return `${type}:${address}`;
}

export function getMemoForUnbond({ address, unbondAmount }: UnbondParams) {
  return `${MemoType.UNBOND}:${address}:${unbondAmount}`;
}

/**
 * Deposit
 */
export function getMemoForRunePoolDeposit(affiliate?: WithAffiliate<{}>) {
  return addAffiliate(MemoType.RUNEPOOL_DEPOSIT, affiliate);
}

export function getMemoForDeposit({
  chain,
  symbol,
  address,
  ...affiliate
}: WithAffiliate<{ chain: Chain; symbol: string; address?: string }>) {
  const poolIdentifier = getPoolIdentifier({ chain, symbol });
  const addressPart = address ? `:${address}:` : ":";

  return addAffiliate(`${MemoType.DEPOSIT}:${poolIdentifier}${addressPart}`, affiliate);
}

/**
 * Withdraw
 */
export function getMemoForWithdraw({ chain, symbol, ticker, basisPoints, targetAsset }: WithdrawParams) {
  const shortenedSymbol = chain === "ETH" && ticker !== "ETH" ? `${ticker}-${symbol.slice(-3)}` : symbol;
  const targetPart = targetAsset ? `:${targetAsset}` : "";

  return `${MemoType.WITHDRAW}:${chain}.${shortenedSymbol}:${basisPoints}${targetPart}`;
}

export function getMemoForRunePoolWithdraw({ basisPoints, ...affiliate }: WithAffiliate<{ basisPoints: number }>) {
  return addAffiliate(`${MemoType.RUNEPOOL_WITHDRAW}:${basisPoints}`, affiliate);
}

/**
 * TNS
 */
export function getMemoForNameRegister({ name, chain, address, owner }: NameRegisterParams) {
  const baseMemo = `${MemoType.NAME_REGISTER}:${name}:${chain}:${address}`;
  const ownerAssignmentOrChangePart = owner ? `:${owner}` : "";

  return `${baseMemo}${ownerAssignmentOrChangePart}`;
}

export function getMemoForNamePreferredAssetRegister({
  name,
  chain,
  asset,
  payout,
  owner,
}: PreferredAssetRegisterParams) {
  return `${MemoType.NAME_REGISTER}:${name}:${chain}:${payout}:${owner}:${asset}`;
}

export function getMemoForTcyClaim(memoType: MemoType.CLAIM_TCY, { address }: WithAffiliate<{ address: string }>) {
  return `${memoType}:${address}`;
}

export function getMemoForTcyStake(
  memoType: MemoType.STAKE_TCY | MemoType.UNSTAKE_TCY,
  { unstakeBps, ...affiliate }: WithAffiliate<{ unstakeBps?: number }>,
) {
  const bps = unstakeBps ? `:${unstakeBps}` : "";
  const baseMemo = `${memoType}${bps}`;

  return addAffiliate(`${baseMemo}`, affiliate);
}

/**
 * Internal helpers
 */
function addAffiliate(memo: string, { affiliateAddress, affiliateBasisPoints }: WithAffiliate<{}> = {}) {
  const affiliatedMemo = `${memo}${affiliateAddress ? `:${affiliateAddress}:${affiliateBasisPoints || 0}` : ""}`;

  return affiliatedMemo.endsWith(":") ? affiliatedMemo.slice(0, -1) : affiliatedMemo;
}

function getPoolIdentifier({ chain, symbol }: { chain: Chain; symbol: string }) {
  return match(chain)
    .with(Chain.Bitcoin, Chain.Dogecoin, Chain.Litecoin, () => chain.slice(0, 1).toLowerCase())
    .with(Chain.BitcoinCash, () => "c")
    .otherwise(() => `${chain}.${symbol}`);
}

type WithAffiliate<T extends {}> = T & { affiliateAddress?: string; affiliateBasisPoints?: number };

type BondOrLeaveParams = { type: MemoType.BOND | MemoType.LEAVE; address: string };
type UnbondParams = { address: string; unbondAmount: number };
type NameRegisterParams = { name: string; chain: string; address: string; owner?: string };
type PreferredAssetRegisterParams = { name: string; chain: Chain; asset: string; payout: string; owner: string };
type WithdrawParams = { chain: Chain; symbol: string; ticker: string; basisPoints: number; targetAsset?: string };
