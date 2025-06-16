import type { Provider } from "@near-js/providers";
import {
  Chain,
  type DerivationPathArray,
  SKConfig,
  SwapKitError,
  derivationPathToString,
} from "@swapkit/helpers";
import type { KeyPair, PublicKey } from "near-api-js/lib/utils";
import type { NearConfig } from "../types";

export async function createNearConnection() {
  const { connect } = await import("near-api-js");

  const rpcUrl = SKConfig.get("rpcUrls")[Chain.Near];
  const { isStagenet } = SKConfig.get("envs");

  const networkId = isStagenet ? "testnet" : "mainnet";
  const nodeUrl = rpcUrl;

  if (!nodeUrl) {
    throw new SwapKitError("toolbox_near_no_rpc_url");
  }

  const config: NearConfig = {
    networkId,
    nodeUrl,
  };

  return connect(config);
}

export async function validateNearAddress(address: string) {
  // Use the official NEAR SDK validation function if available
  try {
    const { validateAccountId } = await import("near-sdk-js");
    return validateAccountId(address);
  } catch {
    return validateNearAddressManual(address);
  }
}

function validateNearAddressManual(address: string) {
  // Official NEAR validation logic from near-sdk-js
  const ACCOUNT_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

  return address.length >= 2 && address.length <= 64 && ACCOUNT_ID_REGEX.test(address);
}

export async function getNearSignerFromPhrase(params: {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}) {
  const { parseSeedPhrase } = await import("near-seed-phrase");
  const { KeyPair } = await import("near-api-js/lib/utils");

  // Handle derivation path logic here
  // NEAR uses a 3-level derivation path: m/44'/397'/index'
  const index = params.index || 0;
  const derivationPath = params.derivationPath
    ? derivationPathToString(params.derivationPath.slice(0, 3) as [number, number, number])
    : `m/44'/397'/${index}'`;

  const { secretKey } = parseSeedPhrase(params.phrase, derivationPath);
  const keyPair = KeyPair.fromString(secretKey);

  return createNearSignerFromKeyPair(keyPair);
}

export async function getNearSignerFromPrivateKey(privateKey: string) {
  const { KeyPair } = await import("near-api-js/lib/utils");
  const keyPair = KeyPair.fromString(privateKey);
  return createNearSignerFromKeyPair(keyPair);
}

function createNearSignerFromKeyPair(keyPair: KeyPair) {
  const signer = {
    createKey(_accountId: string, _networkId: string): Promise<PublicKey> {
      // For our use case, we return the existing public key
      return Promise.resolve(keyPair.getPublicKey());
    },
    getPublicKey(_accountId?: string, _networkId?: string): Promise<PublicKey> {
      return Promise.resolve(keyPair.getPublicKey());
    },
    async signMessage(
      message: Uint8Array,
      _accountId?: string,
      _networkId?: string,
    ): Promise<{ signature: Uint8Array; publicKey: PublicKey }> {
      const hash = await crypto.subtle.digest("SHA-256", message);
      const signature = keyPair.sign(new Uint8Array(hash));

      return {
        signature: signature.signature,
        publicKey: keyPair.getPublicKey(),
      };
    },
    getAddress: () => {
      // For implicit accounts, derive account ID from public key
      // NEAR implicit accounts use hex representation of the public key
      const publicKey = keyPair.getPublicKey();
      const hexAddress = Buffer.from(publicKey.data).toString("hex");
      return Promise.resolve(hexAddress);
    },
    keyPair,
  };

  return signer;
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
  return utils.PublicKey.fromString(fullAccessKey.public_key);
}
