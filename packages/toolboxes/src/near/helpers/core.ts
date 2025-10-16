import type { KeyPair } from "@near-js/crypto";
import type { Provider } from "@near-js/providers";
import { KeyPairSigner } from "@near-js/signers";
import { type DerivationPathArray, derivationPathToString, SwapKitError } from "@swapkit/helpers";
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
  const { KeyPair } = await import("@near-js/crypto");

  const index = params.index || 0;
  const derivationPath = params.derivationPath
    ? derivationPathToString(params.derivationPath.slice(0, 3) as [number, number, number])
    : `m/44'/397'/${index}'`;

  const { secretKey } = parseSeedPhrase(params.phrase, derivationPath);
  const keyPair = KeyPair.fromString(secretKey as any);

  return createNearSignerFromKeyPair(keyPair);
}

export async function getNearSignerFromPrivateKey(privateKey: string) {
  const { KeyPair } = await import("@near-js/crypto");
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
  const response = await provider.query({
    account_id: accountId,
    finality: "final",
    request_type: "view_access_key_list",
  });

  const fullAccessKey = (response as any).keys.find((key: any) => key.access_key.permission === "FullAccess");

  if (!fullAccessKey) {
    throw new SwapKitError("toolbox_near_no_public_key_found");
  }
  const { PublicKey } = await import("@near-js/crypto");

  const publicKey = PublicKey.fromString(fullAccessKey.public_key);
  const nonce = (fullAccessKey.access_key.nonce as number) || 0;

  return { nonce, publicKey };
}
