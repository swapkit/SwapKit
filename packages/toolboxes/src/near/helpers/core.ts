import type { Provider } from "@near-js/providers";
import { type DerivationPathArray, SwapKitError, derivationPathToString } from "@swapkit/helpers";
import { type KeyPair, KeyPairSigner } from "near-api-js";
import type { NearSigner } from "../types";

export async function getValidateNearAddress() {
  const { validateAccountId } = await import("near-sdk-js");
  return (address: string) => {
    // Use the official NEAR SDK validation function if available
    try {
      return validateAccountId(address);
    } catch {
      const ACCOUNT_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

      return address.length >= 2 && address.length <= 64 && ACCOUNT_ID_REGEX.test(address);
    }
  };
}

export async function getNearSignerFromPhrase(params: {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}) {
  const { parseSeedPhrase } = await import("near-seed-phrase");
  const { KeyPair } = await import("near-api-js");

  // Handle derivation path logic here
  // NEAR uses a 3-level derivation path: m/44'/397'/index'
  const index = params.index || 0;
  const derivationPath = params.derivationPath
    ? derivationPathToString(params.derivationPath.slice(0, 3) as [number, number, number])
    : `m/44'/397'/${index}'`;

  const { secretKey } = parseSeedPhrase(params.phrase, derivationPath);
  const keyPair = KeyPair.fromString(secretKey as any);

  return createNearSignerFromKeyPair(keyPair);
}

export async function getNearSignerFromPrivateKey(privateKey: string) {
  const { KeyPair } = await import("near-api-js/lib/utils");
  const keyPair = KeyPair.fromString(privateKey as any);
  return createNearSignerFromKeyPair(keyPair);
}

class SKKeyPairSigner extends KeyPairSigner {
  #keyPair: KeyPair;

  constructor(keyPair: KeyPair) {
    super(keyPair);
    this.#keyPair = keyPair;
  }

  getAddress(): Promise<string> {
    // For implicit accounts, derive account ID from public key
    // NEAR implicit accounts use hex representation of the public key
    const publicKey = this.#keyPair.getPublicKey();
    const hexAddress = Buffer.from(publicKey.data).toString("hex");
    return Promise.resolve(hexAddress);
  }
}

function createNearSignerFromKeyPair(keyPair: KeyPair): NearSigner {
  const keyPairSigner = new SKKeyPairSigner(keyPair);

  return keyPairSigner;
}

export async function getFullAccessPublicKey(provider: Provider, accountId: string) {
  // Get the first full access key for the account
  const response = await provider.query({
    request_type: "view_access_key_list",
    finality: "final",
    account_id: accountId,
  });

  const fullAccessKey = (response as any).keys.find(
    (key: any) => key.access_key.permission === "FullAccess",
  );

  if (!fullAccessKey) {
    throw new SwapKitError("toolbox_near_invalid_address");
  }

  const { utils } = await import("near-api-js");
  const publicKey = utils.PublicKey.fromString(fullAccessKey.public_key);
  const nonce = (fullAccessKey.access_key.nonce as number) || 0;

  return { publicKey, nonce };
}
