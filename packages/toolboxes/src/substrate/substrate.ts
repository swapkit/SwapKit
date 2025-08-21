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
  type DerivationPathArray,
  type GenericCreateTransactionParams,
  type SubstrateChain,
  SwapKitError,
  SwapKitNumber,
  getRPCUrl,
} from "@swapkit/helpers";

import { P, match } from "ts-pattern";
import { createBalanceGetter } from "./balance";
import { SubstrateNetwork, type SubstrateTransferParams } from "./types";

export const PolkadotToolbox = ({ generic = false, ...signerParams }: ToolboxParams = {}) => {
  return createSubstrateToolbox({ chain: Chain.Polkadot, generic, ...signerParams });
};

export const ChainflipToolbox = async ({
  generic = false,
  ...signerParams
}: ToolboxParams = {}) => {
  const toolbox = await createSubstrateToolbox({
    chain: Chain.Chainflip,
    generic,
    ...signerParams,
  });

  return { ...toolbox };
};

export type SubstrateToolboxes = {
  DOT: Awaited<ReturnType<typeof PolkadotToolbox>>;
  FLIP: Awaited<ReturnType<typeof ChainflipToolbox>>;
};

export function getSubstrateToolbox<T extends SubstrateChain>(chain: T, params?: ToolboxParams) {
  switch (chain) {
    case Chain.Chainflip: {
      return ChainflipToolbox(params);
    }
    case Chain.Polkadot: {
      return PolkadotToolbox(params);
    }
    default:
      throw new SwapKitError("toolbox_substrate_not_supported", { chain });
  }
}

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

const createTransaction = (api: ApiPromise, { recipient, assetValue }: SubstrateTransferParams) =>
  api.tx.balances?.transferAllowDeath?.(recipient, assetValue.getBaseValue("number"));

const transfer = async (
  api: ApiPromise,
  signer: IKeyringPair | Signer,
  { recipient, assetValue, sender }: SubstrateTransferParams,
) => {
  const transfer = createTransaction(api, {
    recipient,
    assetValue,
  });

  const isKeyring = isKeyringPair(signer);

  if (!transfer) return;

  const address = isKeyring ? (signer as IKeyringPair).address : sender;
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
  { recipient, assetValue, sender }: SubstrateTransferParams,
) => {
  const transfer = createTransaction(api, { recipient, assetValue });

  const address = isKeyringPair(signer) ? signer.address : sender;
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
  chain,
}: {
  api: ApiPromise;
  network: SubstrateNetwork;
  gasAsset: AssetValue;
  signer?: IKeyringPair | Signer;
  chain?: SubstrateChain;
}) => ({
  api,
  network,
  gasAsset,
  decodeAddress,
  encodeAddress,
  convertAddress,
  getBalance: createBalanceGetter(chain || Chain.Polkadot, api),
  createKeyring: (phrase: string) => createKeyring(phrase, network.prefix),
  getAddress: (keyring?: IKeyringPair | Signer) => {
    const keyringPair = keyring || signer;
    if (!keyringPair) throw new SwapKitError("core_wallet_not_keypair_wallet");

    return isKeyringPair(keyringPair) ? keyringPair.address : undefined;
  },
  createTransaction: (params: GenericCreateTransactionParams) => createTransaction(api, params),
  validateAddress: (address: string) => validateAddress(address, network.prefix),
  transfer: (params: SubstrateTransferParams) => {
    if (!signer) throw new SwapKitError("core_wallet_not_keypair_wallet");
    return transfer(api, signer, params);
  },
  estimateTransactionFee: (params: SubstrateTransferParams) => {
    if (!signer) throw new SwapKitError("core_wallet_not_keypair_wallet");
    return estimateTransactionFee(api, signer, gasAsset, params);
  },
  sign: (tx: SubmittableExtrinsic<"promise">) => {
    if (!signer) throw new SwapKitError("core_wallet_not_keypair_wallet");
    if (isKeyringPair(signer)) return sign(signer, tx);

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
    if (!signer) throw new SwapKitError("core_wallet_not_keypair_wallet");
    if (isKeyringPair(signer)) return signAndBroadcastKeyring(signer, tx, callback);

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
  const { prefix } = chain === Chain.Polkadot ? SubstrateNetwork.DOT : SubstrateNetwork.FLIP;

  return (
    validateAddress(address, prefix) || validateAddress(address, SubstrateNetwork.GENERIC.prefix)
  );
};

export async function createSubstrateToolbox({
  generic,
  chain,
  ...signerParams
}: ToolboxParams & { chain: SubstrateChain }) {
  const { ApiPromise, WsProvider } = await import("@polkadot/api");

  const rpcUrl = await getRPCUrl(chain);
  const provider = new WsProvider(rpcUrl);
  const api = await ApiPromise.create({ provider });
  const gasAsset = AssetValue.from({ chain });
  const network = generic ? SubstrateNetwork.GENERIC : SubstrateNetwork[chain];

  const signer = await match(signerParams)
    .with({ phrase: P.string }, ({ phrase }) =>
      createKeyring(phrase, SubstrateNetwork[chain].prefix),
    )
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  return BaseSubstrateToolbox({ api, signer, gasAsset, network, chain });
}

export type ToolboxParams = {
  generic?: boolean;
} & (
  | {
      signer?: KeyringPair | Signer;
    }
  | {
      phrase?: string;
      derivationPath?: DerivationPathArray;
      index?: number;
    }
);
