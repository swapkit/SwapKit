import { toBech32 } from "@cosmjs/encoding";
import { base64, bech32 } from "@scure/base";
import { fromByteArray, toByteArray } from "base64-js";

export function bech32ToBase64(address: string) {
  return base64.encode(Uint8Array.from(bech32.fromWords(bech32.decode(address).words)));
}

export function base64ToBech32(address: string, prefix = "thor") {
  return toBech32(prefix, base64.decode(address));
}

export function toBase64(data: Uint8Array) {
  return fromByteArray(data);
}

export function fromBase64(base64String: string) {
  if (!base64String.match(/^[a-zA-Z0-9+/]*={0,2}$/)) {
    throw new Error("Invalid base64 string format");
  }
  return toByteArray(base64String);
}
