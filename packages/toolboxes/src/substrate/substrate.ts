import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { Callback, IKeyringPair, ISubmittableResult, Signer } from "@polkadot/types/types";
import { hexToU8a, isHex, u8aToHex } from "@polkadot/util";
import {
  decodeAddress as decodePolkadotAddress,
  encodeAddress as encodePolkadotAddress,
} from "@polkadot/util-crypto";
import {
  AssetValue,
  Chain,
  SKConfig,
  type SubstrateChain,
  SwapKitError,
  SwapKitNumber,
} from "@swapkit/helpers";

import { getBalance } from "../utils";
import { Network, type SubstrateNetwork, type SubstrateTransferParams } from "./types";

export const PolkadotToolbox = ({ signer, generic = false }: ToolboxParams) => {
  return createSubstrateToolbox({ chain: Chain.Polkadot, generic, signer });
};

export const ChainflipToolbox = async ({ signer, generic = false }: ToolboxParams) => {
  const toolbox = await createSubstrateToolbox({ chain: Chain.Chainflip, generic, signer });

  return { ...toolbox, getBalance: getBalance(Chain.Chainflip) };
};

type ToolboxType = {
  DOT: ReturnType<typeof PolkadotToolbox>;
  FLIP: ReturnType<typeof ChainflipToolbox>;
};

export const getSubstrateToolbox = <T extends keyof ToolboxType>(
  chain: T,
  params: ToolboxParams,
): ToolboxType[T] => {
  switch (chain) {
    case Chain.Chainflip:
      return ChainflipToolbox(params);
    case Chain.Polkadot:
      return PolkadotToolbox(params);
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};

export function isKeyringPair(account: IKeyringPair | Signer): account is IKeyringPair {
  return "address" in account;
}

export async function createKeyring(phrase: string, networkPrefix: number) {
  const { Keyring } = await import("@polkadot/api");
  const { cryptoWaitReady } = await import("@polkadot/util-crypto");
  await cryptoWaitReady();

  return new Keyring({ type: "sr25519", ss58Format: networkPrefix }).addFromUri(phrase);
}

const getNonce = (api: ApiPromise, address: string) => api.rpc.system.accountNextIndex(address);

const validateAddress = (address: string, networkPrefix: number) => {
  try {
    const decodedAddress = decodeAddress(address, networkPrefix);

    encodeAddress(decodedAddress, "ss58", networkPrefix);

    return true;
  } catch (_error) {
    return false;
  }
};

const createTransfer = (
  api: ApiPromise,
  { recipient, amount }: { recipient: string; amount: number },
) => api.tx.balances?.transferAllowDeath?.(recipient, amount);

const transfer = async (
  api: ApiPromise,
  signer: IKeyringPair | Signer,
  { recipient, assetValue, from }: SubstrateTransferParams,
) => {
  const transfer = createTransfer(api, {
    recipient,
    amount: assetValue.getBaseValue("number"),
  });

  const isKeyring = isKeyringPair(signer);

  if (!transfer) return;

  const address = from || (isKeyring ? (signer as IKeyringPair).address : undefined);
  if (!address) throw new SwapKitError("core_transaction_invalid_sender_address");

  const nonce = await getNonce(api, address);

  const tx = await transfer.signAndSend(isKeyring ? signer : address, {
    signer: isKeyring ? undefined : signer,
    nonce,
  });

  return tx?.toString();
};

const estimateTransactionFee = async (
  api: ApiPromise,
  signer: IKeyringPair | Signer,
  gasAsset: AssetValue,
  { recipient, assetValue, from }: SubstrateTransferParams,
) => {
  const transfer = createTransfer(api, { recipient, amount: assetValue.getBaseValue("number") });

  const address = from || (isKeyringPair(signer) && signer.address);
  if (!address) return;

  const paymentInfo = (await transfer?.paymentInfo(address, {
    nonce: await getNonce(api, address),
  })) || { partialFee: 0 };
  return gasAsset.set(
    SwapKitNumber.fromBigInt(BigInt(paymentInfo.partialFee.toString()), gasAsset.decimal).getValue(
      "string",
    ),
  );
};

const broadcast = async (
  tx: SubmittableExtrinsic<"promise">,
  callback?: Callback<ISubmittableResult>,
) => {
  if (callback) return tx.send(callback);
  const hash = await tx.send();
  return hash.toString();
};

const sign = async (signer: IKeyringPair, tx: SubmittableExtrinsic<"promise">) => {
  const signedTx = await tx.signAsync(signer);
  return signedTx;
};

const signAndBroadcastKeyring = (
  signer: IKeyringPair,
  tx: SubmittableExtrinsic<"promise">,
  callback?: Callback<ISubmittableResult>,
) => {
  if (callback) return tx.signAndSend(signer, callback);
  const hash = tx.signAndSend(signer);
  return hash.toString();
};

const signAndBroadcast = async ({
  signer,
  address,
  tx,
  callback,
  api,
}: {
  signer: Signer;
  address: string;
  tx: SubmittableExtrinsic<"promise">;
  api: ApiPromise;
  callback?: Callback<ISubmittableResult>;
}) => {
  const nonce = await getNonce(api, address);
  if (callback) {
    tx.signAndSend(address, { nonce, signer }, callback);
  }
  const hash = tx.signAndSend(address, { nonce, signer });
  return hash.toString();
};

function convertAddress(address: string, newPrefix: number) {
  const decodedAddress = decodePolkadotAddress(address);
  const convertedAddress = encodePolkadotAddress(decodedAddress, newPrefix);
  return convertedAddress;
}

function decodeAddress(address: string, networkPrefix?: number) {
  return isHex(address)
    ? hexToU8a(address)
    : decodePolkadotAddress(address, undefined, networkPrefix);
}

function encodeAddress(
  address: Uint8Array,
  encoding: "ss58" | "hex" = "ss58",
  networkPrefix?: number,
) {
  if (encoding === "hex") {
    return u8aToHex(address);
  }

  return encodePolkadotAddress(address, networkPrefix);
}

export const BaseSubstrateToolbox = ({
  api,
  network,
  gasAsset,
  signer,
}: {
  api: ApiPromise;
  network: SubstrateNetwork;
  gasAsset: AssetValue;
  signer: IKeyringPair | Signer;
}) => ({
  api,
  network,
  gasAsset,
  decodeAddress,
  encodeAddress,
  convertAddress,
  getBalance: getBalance(Chain.Polkadot),
  createKeyring: (phrase: string) => createKeyring(phrase, network.prefix),
  getAddress: (keyring: IKeyringPair | Signer = signer) =>
    isKeyringPair(keyring) ? keyring.address : undefined,
  createTransfer: ({ recipient, assetValue }: { recipient: string; assetValue: AssetValue }) =>
    createTransfer(api, { recipient, amount: assetValue.getBaseValue("number") }),
  validateAddress: (address: string) => validateAddress(address, network.prefix),
  transfer: (params: SubstrateTransferParams) => transfer(api, signer, params),
  estimateTransactionFee: (params: SubstrateTransferParams) =>
    estimateTransactionFee(api, signer, gasAsset, params),
  sign: (tx: SubmittableExtrinsic<"promise">) => {
    if (isKeyringPair(signer)) {
      return sign(signer, tx);
    }
    throw new SwapKitError(
      "core_wallet_not_keypair_wallet",
      "Signer does not have keyring pair capabilities required for signing.",
    );
  },
  broadcast,
  signAndBroadcast: ({
    tx,
    callback,
    address,
  }: {
    tx: SubmittableExtrinsic<"promise">;
    callback?: Callback<ISubmittableResult>;
    address?: string;
  }) => {
    if (isKeyringPair(signer)) {
      return signAndBroadcastKeyring(signer, tx, callback);
    }

    if (address) {
      return signAndBroadcast({ signer, address, tx, callback, api });
    }

    throw new SwapKitError(
      "core_wallet_not_keypair_wallet",
      "Signer does not have keyring pair capabilities required for signing.",
    );
  },
});

export const substrateValidateAddress = ({
  address,
  chain,
}: { address: string; chain: Chain.Polkadot | Chain.Chainflip }) => {
  const { prefix } = chain === Chain.Polkadot ? Network.DOT : Network.FLIP;

  return validateAddress(address, prefix) || validateAddress(address, Network.GENERIC.prefix);
};

export async function createSubstrateToolbox({
  generic,
  chain,
  signer,
}: ToolboxParams & { chain: SubstrateChain }) {
  const { ApiPromise, WsProvider } = await import("@polkadot/api");

  const provider = new WsProvider(SKConfig.get("rpcUrls")[chain]);
  const api = await ApiPromise.create({ provider });
  const gasAsset = AssetValue.from({ chain });
  const network = generic ? Network.GENERIC : Network[chain];

  return BaseSubstrateToolbox({ api, signer, gasAsset, network });
}

export type ToolboxParams = {
  generic?: boolean;
  signer: KeyringPair | Signer;
};

export type BaseSubstrateWallet = ReturnType<typeof BaseSubstrateToolbox>;
export type SubstrateWallets = {
  [chain in SubstrateChain]: BaseSubstrateWallet;
};
