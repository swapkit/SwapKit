import {
  type Pubkey,
  Secp256k1HdWallet,
  createMultisigThresholdPubkey,
  encodeSecp256k1Pubkey,
  pubkeyToAddress,
} from "@cosmjs/amino";
import { Secp256k1, Secp256k1Signature, stringToPath } from "@cosmjs/crypto";
import { type Account, makeMultisignedTxBytes } from "@cosmjs/stargate";
import { base64 } from "@scure/base";
import {
  BaseDecimal,
  Chain,
  type ChainId,
  CosmosChainPrefixes,
  DerivationPath,
  FeeOption,
  RequestClient,
  SKConfig,
  SwapKitError,
  SwapKitNumber,
} from "@swapkit/helpers";

import {
  buildAminoMsg,
  buildDepositTx,
  buildEncodedTxBody,
  buildTransferTx,
  convertToSignable,
  createDefaultAminoTypes,
  createDefaultRegistry,
  prepareMessageForBroadcast,
} from "../thorchainUtils/index";
import type {
  DepositParam,
  MayaToolboxType,
  ThorchainConstantsResponse,
  ThorchainToolboxType,
} from "../thorchainUtils/types/client-types";
import type { Signer, TransferParams } from "../types";
import {
  createOfflineStargateClient,
  createSigningStargateClient,
  createStargateClient,
  getDefaultChainFee,
} from "../util";

import { BaseCosmosToolbox } from "./BaseCosmosToolbox";

function secp256k1HdWalletFromMnemonic({
  prefix,
  derivationPath,
}: { prefix: string; derivationPath: string }) {
  return function secp256k1HdWalletFromMnemonic(mnemonic: string, index = 0) {
    return Secp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath(`${derivationPath}/${index}`)],
      prefix,
    });
  };
}

function exportSignature(signature: Uint8Array) {
  return base64.encode(signature);
}

async function signMultisigTx(
  wallet: Secp256k1HdWallet,
  tx: string,
  chain: Chain.THORChain | Chain.Maya,
) {
  const {
    msgs,
    accountNumber,
    sequence,
    chainId,
    fee,
    memo,
  }: {
    msgs: ReturnType<typeof buildAminoMsg>[];
    accountNumber: number;
    sequence: number;
    chainId: ChainId;
    fee: ReturnType<typeof getDefaultChainFee>;
    memo: string;
  } = JSON.parse(tx);

  const address = (await wallet.getAccounts())?.[0]?.address || "";
  const aminoTypes = createDefaultAminoTypes(chain);
  const registry = createDefaultRegistry();
  const signingClient = await createOfflineStargateClient(wallet, { registry, aminoTypes });
  const msgForSigning = [];

  for (const msg of msgs) {
    // @ts-expect-error wrong typing of convertToSignable - investigation needed
    const signMsg = convertToSignable(msg, chain);
    msgForSigning.push(signMsg);
  }

  const {
    signatures: [signature],
  } = await signingClient.sign(address, msgForSigning, fee, memo, {
    accountNumber,
    sequence,
    chainId,
  });

  const bodyBytes = buildEncodedTxBody({ chain, memo, msgs: msgs.map(prepareMessageForBroadcast) });

  return { signature: exportSignature(signature as Uint8Array), bodyBytes };
}

function broadcastMultisigTx({ prefix, rpcUrl }: { prefix: string; rpcUrl: string }) {
  return async function broadcastMultisigTx(
    tx: string,
    signers: Signer[],
    membersPubKeys: string[],
    threshold: number,
    bodyBytes: Uint8Array,
  ) {
    const { sequence, fee } = JSON.parse(tx);
    const multisigPubkey = await createMultisig(membersPubKeys, threshold);

    const addressesAndSignatures: [string, Uint8Array][] = signers.map((signer) => [
      pubkeyToAddress(encodeSecp256k1Pubkey(base64.decode(signer.pubKey)), prefix),
      base64.decode(signer.signature),
    ]);

    const broadcaster = await createStargateClient(rpcUrl);

    const { transactionHash } = await broadcaster.broadcastTx(
      makeMultisignedTxBytes(
        multisigPubkey,
        sequence,
        fee,
        bodyBytes,
        new Map<string, Uint8Array>(addressesAndSignatures),
      ),
    );

    return transactionHash;
  };
}

async function createMultisig(pubKeys: string[], threshold: number, noSortPubKeys = true) {
  return createMultisigThresholdPubkey(
    pubKeys.map((pubKey) => encodeSecp256k1Pubkey(base64.decode(pubKey))),
    threshold,
    noSortPubKeys,
  );
}

function importSignature(signature: string) {
  return base64.decode(signature);
}

function __REEXPORT__pubkeyToAddress(prefix: string) {
  return function __pubkeyToAddress(pubkey: Pubkey) {
    return pubkeyToAddress(pubkey, prefix);
  };
}

async function signWithPrivateKey({
  privateKey,
  message,
}: { privateKey: Uint8Array; message: string }) {
  const signature = await Secp256k1.createSignature(base64.decode(message), privateKey);
  return base64.encode(Buffer.concat([signature.r(32), signature.s(32)]));
}

function verifySignature(getAccount: (address: string) => Promise<Account | null>) {
  return async function verifySignature({
    signature,
    message,
    address,
  }: {
    signature: string;
    message: string;
    address: string;
  }) {
    const account = await getAccount(address);
    if (!account?.pubkey) throw new SwapKitError("toolbox_cosmos_verify_signature_no_pubkey");

    const secpSignature = Secp256k1Signature.fromFixedLength(base64.decode(signature));
    return Secp256k1.verifySignature(secpSignature, base64.decode(message), account.pubkey.value);
  };
}

export function BaseThorchainToolbox(chain: Chain.THORChain | Chain.Maya): ThorchainToolboxType {
  const nodeUrl = SKConfig.get("nodeUrls")[chain];
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const { isStagenet } = SKConfig.get("envs");

  const isThorchain = chain === Chain.THORChain;
  const chainPrefix = `${isStagenet ? "s" : ""}${CosmosChainPrefixes[chain]}`;
  const derivationPath = DerivationPath[chain];

  const cosmosToolbox = BaseCosmosToolbox({ chain, derivationPath, prefix: chainPrefix });
  const defaultFee = getDefaultChainFee(chain);

  function loadAddressBalances(address: string) {
    try {
      return cosmosToolbox.getBalance(address);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function getFees() {
    let fee: SwapKitNumber;

    const constantsUrl = `${nodeUrl}/${isThorchain ? "thorchain" : "mayachain"}/constants`;

    try {
      const {
        int_64_values: { NativeTransactionFee: nativeFee },
      } = await RequestClient.get<ThorchainConstantsResponse>(constantsUrl);

      if (!nativeFee || Number.isNaN(nativeFee) || nativeFee < 0) {
        throw Error(`Invalid nativeFee: ${nativeFee.toString()}`);
      }

      fee = new SwapKitNumber(nativeFee);
    } catch {
      fee = new SwapKitNumber({ value: isThorchain ? 0.02 : 1, decimal: BaseDecimal[chain] });
    }

    return { [FeeOption.Average]: fee, [FeeOption.Fast]: fee, [FeeOption.Fastest]: fee };
  }

  async function transfer({
    from,
    recipient,
    assetValue,
    memo = "",
    signer,
  }: Omit<TransferParams, "recipient"> & { recipient?: string }) {
    if (!signer) throw new Error("Signer not defined");

    const registry = createDefaultRegistry();
    const aminoTypes = createDefaultAminoTypes(chain);
    const signingClient = await createSigningStargateClient(rpcUrl, signer, {
      registry,
      aminoTypes,
    });

    const msgSign = convertToSignable(
      prepareMessageForBroadcast(buildAminoMsg({ assetValue, from, recipient, memo, chain })),
      chain,
    );

    const txResponse = await signingClient.signAndBroadcast(from, [msgSign], defaultFee, memo);

    return txResponse.transactionHash;
  }

  return {
    ...cosmosToolbox,
    deposit: (params: DepositParam & { from: string }) => transfer(params),
    transfer,
    getFees,
    buildAminoMsg,
    convertToSignable,
    buildDepositTx: buildDepositTx(rpcUrl),
    buildTransferTx: buildTransferTx(rpcUrl),
    buildEncodedTxBody,
    prepareMessageForBroadcast,
    createDefaultAminoTypes: () => createDefaultAminoTypes(chain),
    createDefaultRegistry,
    secp256k1HdWalletFromMnemonic: secp256k1HdWalletFromMnemonic({
      derivationPath,
      prefix: chainPrefix,
    }),
    signMultisigTx: (wallet: Secp256k1HdWallet, tx: string) => signMultisigTx(wallet, tx, chain),
    broadcastMultisigTx: broadcastMultisigTx({ prefix: chainPrefix, rpcUrl }),
    createMultisig,
    importSignature,
    loadAddressBalances,
    pubkeyToAddress: __REEXPORT__pubkeyToAddress(chainPrefix),
    signWithPrivateKey,
    verifySignature: verifySignature(cosmosToolbox.getAccount),
  };
}

export function ThorchainToolbox(): ThorchainToolboxType {
  return BaseThorchainToolbox(Chain.THORChain);
}

export function MayaToolbox(): MayaToolboxType {
  return BaseThorchainToolbox(Chain.Maya);
}

export type ThorchainWallet = Omit<ReturnType<typeof BaseThorchainToolbox>, "signMessage">;
export type ThorchainWallets = {
  [chain in Chain.THORChain | Chain.Maya]: ThorchainWallet;
};
