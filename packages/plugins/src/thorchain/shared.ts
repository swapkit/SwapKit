import { Chain } from "@swapkit/helpers";
import type { CoreTxParams } from "./types";

export function validateAddressType({ chain, address }: { chain?: Chain; address?: string }) {
  if (!address) return false;

  return chain === Chain.Bitcoin ? !address.startsWith("bc1p") : true;
}

export function prepareTxParams({
  assetValue,
  from,
  memo = "",
  ...restTxParams
}: CoreTxParams & { from: string; router?: string }) {
  return { ...restTxParams, assetValue, from, memo };
}
