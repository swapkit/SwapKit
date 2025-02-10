import { Chain } from "@swapkit/helpers";
import type { CoreTxParams } from "./types";

export const validateAddressType = ({
  chain,
  address,
}: {
  chain?: Chain;
  address?: string;
}) => {
  if (!address) return false;

  switch (chain) {
    case Chain.Bitcoin:
      // filter out taproot addresses
      return !address.startsWith("bc1p");
    default:
      return true;
  }
};

export function prepareTxParams({
  assetValue,
  from,
  memo = "",
  ...restTxParams
}: CoreTxParams & { from: string; router?: string }) {
  return { ...restTxParams, memo, from, assetValue };
}
