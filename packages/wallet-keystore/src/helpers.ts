import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export type Keystore = {
  version: number;
  meta: string;
  crypto: {
    cipher: string;
    cipherparams: { iv: string };
    ciphertext: string;
    kdf: string;
    kdfparams: { prf: string; dklen: number; salt: string; c: number };
    mac: string;
  };
};

async function blake256(initData: Buffer | string) {
  const blakeModule = await import("blakejs");
  const { blake2bFinal, blake2bInit, blake2bUpdate } = blakeModule?.default || blakeModule;
  let data = initData;

  if (!(data instanceof Buffer)) {
    // @ts-expect-error
    data = Buffer.from(data, "hex");
  }

  const context = blake2bInit(32);
  blake2bUpdate(context, data);

  return Array.from(blake2bFinal(context))
    .map((byte) => (byte < 0x10 ? `0${byte.toString(16)}` : byte.toString(16)))
    .join("");
}

export async function encryptToKeyStore(phrase: string, password: string) {
  const cipher = "aes-128-ctr";
  const iv = randomBytes(16);
  const salt = randomBytes(32);
  const kdfParams = { c: 262144, dklen: 32, prf: "hmac-sha256", salt: salt.toString("hex") };

  const derivedKey = pbkdf2Sync(password, salt, kdfParams.c, kdfParams.dklen, "sha256");
  const cipherIV = createCipheriv(cipher, derivedKey.subarray(0, 16), iv);
  const ciphertext = Buffer.concat([cipherIV.update(Buffer.from(phrase, "utf8")), cipherIV.final()]);
  const initData = Buffer.concat([derivedKey.subarray(16, 32), Buffer.from(ciphertext)]);
  const mac = await blake256(initData);

  return {
    crypto: {
      cipher,
      cipherparams: { iv: iv.toString("hex") },
      ciphertext: ciphertext.toString("hex"),
      kdf: "pbkdf2",
      kdfparams: kdfParams,
      mac,
    },
    meta: "xchain-keystore",
    version: 1,
  };
}

export function generatePhrase(size: 12 | 24 = 12) {
  return generateMnemonic(wordlist, size === 12 ? 128 : 256);
}

export function validatePhrase(phrase: string) {
  return validateMnemonic(phrase, wordlist);
}

export async function decryptFromKeystore(keystore: Keystore, password: string) {
  const { SwapKitError } = await import("@swapkit/helpers");

  switch (keystore.version) {
    case 1: {
      const kdfParams = keystore.crypto.kdfparams;
      const salt = Buffer.from(kdfParams.salt, "hex");
      const derivedKey = pbkdf2Sync(password, salt, kdfParams.c, kdfParams.dklen, "sha256");

      const ciphertext = Buffer.from(keystore.crypto.ciphertext, "hex");
      const initData = Buffer.concat([derivedKey.subarray(16, 32), ciphertext]);
      const mac = await blake256(initData);

      if (mac !== keystore.crypto.mac) {
        throw new SwapKitError("wallet_keystore_invalid_password");
      }

      const decipher = createDecipheriv(
        keystore.crypto.cipher,
        derivedKey.subarray(0, 16),
        Buffer.from(keystore.crypto.cipherparams.iv, "hex"),
      );

      const phrase = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return phrase.toString("utf8");
    }

    default:
      throw new SwapKitError("wallet_keystore_unsupported_version");
  }
}
