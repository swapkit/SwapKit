/*
    KeepKey Specific bip32 path conventions
*/

import { SwapKitError } from "@swapkit/helpers";

const HARDENED = 0x80000000;

export enum ChainToKeepKeyName {
  BTC = "Bitcoin",
  BCH = "BitcoinCash",
  DOGE = "Dogecoin",
  LTC = "Litecoin",
  DASH = "Dash",
}

export function addressNListToBIP32(address: number[]) {
  return `m/${address.map((num) => (num >= HARDENED ? `${num - HARDENED}'` : num)).join("/")}`;
}

export function bip32Like(path: string) {
  if (path === "m/") return true;

  return /^m(((\/[0-9]+h)+|(\/[0-9]+H)+|(\/[0-9]+')*)((\/[0-9]+)*))$/.test(path);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor
export function bip32ToAddressNList(initPath: string): number[] {
  let path = initPath;

  if (!bip32Like(path)) {
    throw new SwapKitError("wallet_keepkey_invalid_params", {
      reason: `Not a bip32 path: '${path}'`,
    });
  }

  if (/^m\//i.test(path)) {
    path = path.slice(2);
  }
  const segments = path.split("/");

  if (segments.length === 1 && segments[0] === "") return [];

  const ret = new Array(segments.length);

  for (let i = 0; i < segments.length; i++) {
    // TODO: Check for better way instead of exec
    const segment = segments[i];
    if (segment) {
      const tmp = /(\d+)([hH']?)/.exec(segment);
      if (tmp === null)
        throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Invalid input" });

      const [, num = "", modifier = ""] = tmp;

      ret[i] = Number.parseInt(num, 10);

      if (ret[i] >= HARDENED)
        throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Invalid child index" });

      if (modifier === "h" || modifier === "H" || modifier === "'") {
        ret[i] += HARDENED;
      } else if (modifier.length > 0) {
        throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Invalid modifier" });
      }
    }
  }

  return ret;
}
