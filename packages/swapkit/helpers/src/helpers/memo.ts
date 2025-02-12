import { Chain } from "../types/chains";
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

export function getMemoForSaverDeposit({
  chain,
  symbol,
  ...affiliate
}: WithAffiliate<{ chain: Chain; symbol: string }>) {
  return addAffiliate(`${MemoType.DEPOSIT}:${chain}/${symbol}`, affiliate);
}

export function getMemoForDeposit({
  chain,
  symbol,
  address,
  ...affiliate
}: WithAffiliate<{
  chain: Chain;
  symbol: string;
  address?: string;
}>) {
  const poolIdentifier = getPoolIdentifier({ chain, symbol });
  const addressPart = address ? `:${address}:` : ":";

  return addAffiliate(`${MemoType.DEPOSIT}:${poolIdentifier}${addressPart}`, affiliate);
}

/**
 * Withdraw
 */
export function getMemoForSaverWithdraw({
  chain,
  symbol,
  basisPoints,
}: { chain: Chain; symbol: string; basisPoints: number }) {
  return `${MemoType.WITHDRAW}:${chain}/${symbol}:${basisPoints}`;
}

export function getMemoForWithdraw({
  chain,
  symbol,
  ticker,
  basisPoints,
  targetAsset,
}: WithdrawParams) {
  const shortenedSymbol =
    chain === "ETH" && ticker !== "ETH" ? `${ticker}-${symbol.slice(-3)}` : symbol;
  const targetPart = targetAsset ? `:${targetAsset}` : "";

  return `${MemoType.WITHDRAW}:${chain}.${shortenedSymbol}:${basisPoints}${targetPart}`;
}

export function getMemoForRunePoolWithdraw({
  basisPoints,
  ...affiliate
}: WithAffiliate<{ basisPoints: number }>) {
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

export function getMemoForLoan(
  memoType: MemoType.OPEN_LOAN | MemoType.CLOSE_LOAN,
  {
    asset,
    address,
    minAmount,
    ...affiliate
  }: WithAffiliate<{ address: string; asset: string; minAmount?: string }>,
) {
  const baseMemo = `${memoType}:${asset}:${address}`;
  const minAmountPart = minAmount ? `:${minAmount}` : "";

  return addAffiliate(`${baseMemo}${minAmountPart}`, affiliate);
}

/**
 * Internal helpers
 */
function addAffiliate(
  memo: string,
  { affiliateAddress, affiliateBasisPoints }: WithAffiliate<{}> = {},
) {
  const affiliatedMemo = `${memo}${affiliateAddress ? `:${affiliateAddress}:${affiliateBasisPoints || 0}` : ""}`;

  return affiliatedMemo.endsWith(":") ? affiliatedMemo.slice(0, -1) : affiliatedMemo;
}

function getPoolIdentifier({
  chain,
  symbol,
}: {
  chain: Chain;
  symbol: string;
}) {
  switch (chain) {
    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.Litecoin:
      return chain.slice(0, 1).toLowerCase();
    case Chain.BitcoinCash:
      return "c";

    default:
      return `${chain}.${symbol}`;
  }
}

type WithAffiliate<T extends {}> = T & {
  affiliateAddress?: string;
  affiliateBasisPoints?: number;
};

type BondOrLeaveParams = { type: MemoType.BOND | MemoType.LEAVE; address: string };
type UnbondParams = { address: string; unbondAmount: number };
type NameRegisterParams = { name: string; chain: string; address: string; owner?: string };
type PreferredAssetRegisterParams = {
  name: string;
  chain: Chain;
  asset: string;
  payout: string;
  owner: string;
};
type WithdrawParams = {
  chain: Chain;
  symbol: string;
  ticker: string;
  basisPoints: number;
  targetAsset?: string;
};
