import { SwapKitError } from "@swapkit/helpers";
import base58check from "bs58check";
// @ts-expect-error
import cashaddr from "cashaddrjs";

enum Format {
  Legacy = "legacy",
  Bitpay = "bitpay",
  Cashaddr = "cashaddr",
}
enum UtxoNetwork {
  Mainnet = "mainnet",
  Testnet = "testnet",
}
enum Type {
  P2PKH = "p2pkh",
  P2SH = "p2sh",
}

const VERSION_BYTE = {
  [Format.Legacy]: {
    [UtxoNetwork.Mainnet]: { [Type.P2PKH]: 0, [Type.P2SH]: 5 },
    [UtxoNetwork.Testnet]: { [Type.P2PKH]: 111, [Type.P2SH]: 196 },
  },
  [Format.Bitpay]: {
    [UtxoNetwork.Mainnet]: { [Type.P2PKH]: 28, [Type.P2SH]: 40 },
    [UtxoNetwork.Testnet]: { [Type.P2PKH]: 111, [Type.P2SH]: 196 },
  },
};

type DecodedType = { format: Format; network: UtxoNetwork; type: Type; hash: any };

function isValidAddress(input: any) {
  try {
    decodeAddress(input);
    return true;
  } catch {
    return false;
  }
}

function detectAddressNetwork(address: string) {
  return decodeAddress(address)?.network;
}

function toLegacyAddress(address: string): string {
  const decoded = decodeAddress(address);
  if (decoded?.format === Format.Legacy) {
    return address;
  }
  return encodeAsLegacy(decoded);
}

function toCashAddress(address: string): string {
  const decoded = decodeAddress(address);
  return encodeAsCashaddr(decoded);
}

function decodeAddress(address: string) {
  try {
    const decoded = decodeBase58Address(address);
    if (decoded) {
      return decoded;
    }
  } catch {
    // Try to decode as cashaddr if base58 decoding fails.
  }
  try {
    const decoded = decodeCashAddress(address);
    if (decoded) {
      return decoded;
    }
  } catch {
    // Try to decode as bitpay if cashaddr decoding fails.
  }
  throw new SwapKitError("toolbox_utxo_invalid_address", { address });
}

function decodeBase58Address(address: string) {
  try {
    const payload = base58check.decode(address);

    // BASE_58_CHECK_PAYLOAD_LENGTH
    if (payload.length !== 21) throw new SwapKitError("toolbox_utxo_invalid_address", { address });
    const versionByte = payload[0];
    const hash = Array.prototype.slice.call(payload, 1);

    switch (versionByte) {
      case VERSION_BYTE[Format.Legacy][UtxoNetwork.Mainnet][Type.P2PKH]:
        return { format: Format.Legacy, hash, network: UtxoNetwork.Mainnet, type: Type.P2PKH };

      case VERSION_BYTE[Format.Legacy][UtxoNetwork.Mainnet][Type.P2SH]:
        return { format: Format.Legacy, hash, network: UtxoNetwork.Mainnet, type: Type.P2SH };

      case VERSION_BYTE[Format.Legacy][UtxoNetwork.Testnet][Type.P2PKH]:
        return { format: Format.Legacy, hash, network: UtxoNetwork.Testnet, type: Type.P2PKH };

      case VERSION_BYTE[Format.Legacy][UtxoNetwork.Testnet][Type.P2SH]:
        return { format: Format.Legacy, hash, network: UtxoNetwork.Testnet, type: Type.P2SH };

      case VERSION_BYTE[Format.Bitpay][UtxoNetwork.Mainnet][Type.P2PKH]:
        return { format: Format.Bitpay, hash, network: UtxoNetwork.Mainnet, type: Type.P2PKH };

      case VERSION_BYTE[Format.Bitpay][UtxoNetwork.Mainnet][Type.P2SH]:
        return { format: Format.Bitpay, hash, network: UtxoNetwork.Mainnet, type: Type.P2SH };

      default:
        return;
    }
  } catch {
    return;
  }
}

function decodeCashAddress(address: string) {
  if (address.indexOf(":") !== -1) {
    try {
      return decodeCashAddressWithPrefix(address);
    } catch {
      // Try to decode as legacy if cashaddr decoding fails.
    }
  } else {
    const prefixes = ["bitcoincash", "bchtest", "bchreg"];
    for (const prefix of prefixes) {
      try {
        return decodeCashAddressWithPrefix(`${prefix}:${address}`);
      } catch {
        // Try next prefix if decoding fails.
      }
    }
  }

  return;
}

function decodeCashAddressWithPrefix(address: string) {
  try {
    const { hash, prefix, type } = cashaddr.decode(address);

    return {
      format: Format.Cashaddr,
      hash: Array.prototype.slice.call(hash, 0),
      network: prefix === "bitcoincash" ? UtxoNetwork.Mainnet : UtxoNetwork.Testnet,
      type: type === "P2PKH" ? Type.P2PKH : Type.P2SH,
    };
  } catch {
    return;
  }
}

function encodeAsLegacy(decoded: DecodedType) {
  const versionByte = VERSION_BYTE[Format.Legacy][decoded.network][decoded.type];
  const buffer = Buffer.alloc(1 + decoded.hash.length);
  buffer[0] = versionByte;
  buffer.set(decoded.hash, 1);
  return base58check.encode(buffer);
}

function encodeAsCashaddr(decoded: DecodedType) {
  const prefix = decoded.network === UtxoNetwork.Mainnet ? "bitcoincash" : "bchtest";
  const type = decoded.type === Type.P2PKH ? "P2PKH" : "P2SH";
  const hash = new Uint8Array(decoded.hash);
  return cashaddr.encode(prefix, type, hash);
}

export { detectAddressNetwork, isValidAddress, UtxoNetwork, toCashAddress, toLegacyAddress };
