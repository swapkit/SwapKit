import type { Pubkey, Secp256k1HdWallet } from "@cosmjs/amino";
import { base64 } from "@scure/base";
import {
  Chain,
  CosmosChainPrefixes,
  derivationPathToString,
  FeeOption,
  type GenericTransferParams,
  getChainConfig,
  getRPCUrl,
  NetworkDerivationPath,
  RequestClient,
  SKConfig,
  SwapKitError,
  SwapKitNumber,
  type TCLikeChain,
  updateDerivationPath,
} from "@swapkit/helpers";

import { match, P } from "ts-pattern";
import {
  buildAminoMsg,
  buildEncodedTxBody,
  convertToSignable,
  createDefaultAminoTypes,
  createDefaultRegistry,
  getCreateTransaction,
  parseAminoMessageForDirectSigning,
} from "../thorchainUtils";
import type { ThorchainConstantsResponse } from "../thorchainUtils/types/client-types";
import type { CosmosToolboxParams, MultiSigSigner, MultisigTx } from "../types";
import {
  createOfflineStargateClient,
  createSigningStargateClient,
  createStargateClient,
  getDefaultChainFee,
} from "../util";
import { createCosmosToolbox } from "./cosmos";

function secp256k1HdWalletFromMnemonic({ prefix, derivationPath }: { prefix: string; derivationPath?: string }) {
  return async function secp256k1HdWalletFromMnemonic(mnemonic: string, index = 0) {
    const importedAmino = await import("@cosmjs/amino");
    const Secp256k1HdWallet = importedAmino.Secp256k1HdWallet ?? importedAmino.default?.Secp256k1HdWallet;
    const importedCrypto = await import("@cosmjs/crypto");
    const stringToPath = importedCrypto.stringToPath ?? importedCrypto.default?.stringToPath;

    return Secp256k1HdWallet.fromMnemonic(mnemonic, { hdPaths: [stringToPath(`${derivationPath}/${index}`)], prefix });
  };
}

function exportSignature(signature: Uint8Array) {
  return base64.encode(signature);
}

function signMultisigTx(chain: TCLikeChain) {
  return async function signMultisigTx({ wallet, tx }: { wallet: Secp256k1HdWallet; tx: string | MultisigTx }) {
    const { msgs, accountNumber, sequence, chainId, fee, memo } = typeof tx === "string" ? JSON.parse(tx) : tx;

    const address = (await wallet.getAccounts())?.[0]?.address || "";
    const aminoTypes = await createDefaultAminoTypes(chain);
    const registry = await createDefaultRegistry();
    const signingClient = await createOfflineStargateClient(wallet, { aminoTypes, registry });
    const msgForSigning = [];

    for (const msg of msgs) {
      const signMsg = await convertToSignable(msg, chain);
      msgForSigning.push(signMsg);
    }

    const {
      signatures: [signature],
    } = await signingClient.sign(address, msgForSigning, fee, memo, { accountNumber, chainId, sequence });

    const bodyBytes = await buildEncodedTxBody({ chain, memo, msgs: msgs.map(parseAminoMessageForDirectSigning) });

    return { bodyBytes, signature: exportSignature(signature as Uint8Array) };
  };
}

function broadcastMultisigTx({ prefix, rpcUrl }: { prefix: string; rpcUrl: string }) {
  return async function broadcastMultisigTx(
    tx: string,
    signers: MultiSigSigner[],
    membersPubKeys: string[],
    threshold: number,
    bodyBytes: Uint8Array,
  ) {
    const { encodeSecp256k1Pubkey, pubkeyToAddress } = (await import("@cosmjs/amino")).default;
    const { makeMultisignedTxBytes } = (await import("@cosmjs/stargate")).default;

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
  const { createMultisigThresholdPubkey, encodeSecp256k1Pubkey } = (await import("@cosmjs/amino")).default;
  return createMultisigThresholdPubkey(
    pubKeys.map((pubKey) => encodeSecp256k1Pubkey(base64.decode(pubKey))),
    threshold,
    noSortPubKeys,
  );
}

function importSignature(signature: string) {
  return base64.decode(signature);
}

async function signWithPrivateKey({ privateKey, message }: { privateKey: Uint8Array; message: string }) {
  const { Secp256k1 } = (await import("@cosmjs/crypto")).default;

  const signature = await Secp256k1.createSignature(base64.decode(message), privateKey);
  return base64.encode(Buffer.concat([signature.r(32), signature.s(32)]));
}

export async function createThorchainToolbox({ chain, ...toolboxParams }: CosmosToolboxParams<TCLikeChain>) {
  const nodeUrl = SKConfig.get("nodeUrls")[chain];
  const rpcUrl = await getRPCUrl(chain);
  const { isStagenet } = SKConfig.get("envs");
  const isThorchain = chain === Chain.THORChain;
  const chainPrefix = `${isStagenet ? "s" : ""}${CosmosChainPrefixes[chain]}`;

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;

  const derivationPath =
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index });

  const cosmosToolbox = await createCosmosToolbox({ chain, ...toolboxParams });

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, ({ phrase }) => cosmosToolbox.getSignerFromPhrase({ derivationPath, phrase }))
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  const defaultFee = getDefaultChainFee(chain);

  async function getFees() {
    let fee: SwapKitNumber;

    const constantsUrl = `${nodeUrl}/${isThorchain ? "thorchain" : "mayachain"}/constants`;

    try {
      const {
        int_64_values: { NativeTransactionFee: nativeFee },
      } = await RequestClient.get<ThorchainConstantsResponse>(constantsUrl);

      if (!nativeFee || Number.isNaN(nativeFee) || nativeFee < 0) {
        throw new SwapKitError("toolbox_cosmos_invalid_fee", { nativeFee: nativeFee.toString() });
      }

      fee = new SwapKitNumber(nativeFee);
    } catch {
      fee = new SwapKitNumber({ decimal: getChainConfig(chain).baseDecimal, value: isThorchain ? 0.02 : 1 });
    }

    return { [FeeOption.Average]: fee, [FeeOption.Fast]: fee, [FeeOption.Fastest]: fee };
  }

  async function transfer({
    assetValue,
    memo = "",
    recipient,
  }: Omit<GenericTransferParams, "recipient"> & { recipient?: string }) {
    const { TxRaw } = await import("cosmjs-types/cosmos/tx/v1beta1/tx");
    const sender = (await signer?.getAccounts())?.[0]?.address;
    if (!(sender && signer)) throw new SwapKitError("toolbox_cosmos_no_signer");

    const isAminoSigner = "signAmino" in signer;
    const registry = await createDefaultRegistry();
    const aminoTypes = await createDefaultAminoTypes(chain);
    const signingClient = await createSigningStargateClient(rpcUrl, signer, { aminoTypes, registry });

    const aminoMessage = buildAminoMsg({ assetValue, memo, recipient, sender });

    if (isAminoSigner) {
      const msgSign = await convertToSignable(aminoMessage, chain);

      const { signatures, authInfoBytes } = await signingClient.sign(sender, [msgSign], defaultFee, memo);

      const tx = TxRaw.encode({
        authInfoBytes,
        bodyBytes: await buildEncodedTxBody({
          chain,
          memo,
          msgs: [aminoMessage].map(parseAminoMessageForDirectSigning),
        }),
        signatures,
      }).finish();

      const txResponse = await signingClient.broadcastTx(tx);

      return txResponse.transactionHash;
    }

    const preparedMessage = parseAminoMessageForDirectSigning(aminoMessage);
    const msgSign = await convertToSignable(preparedMessage, chain);
    const txResponse = await signingClient.signAndBroadcast(sender, [msgSign], defaultFee, memo);

    return txResponse.transactionHash;
  }

  return {
    ...cosmosToolbox,
    broadcastMultisigTx: broadcastMultisigTx({ prefix: chainPrefix, rpcUrl }),
    buildAminoMsg,
    buildEncodedTxBody,
    convertToSignable,
    createDefaultAminoTypes: () => createDefaultAminoTypes(chain),
    createDefaultRegistry,
    createMultisig,
    createTransaction: getCreateTransaction(rpcUrl),
    deposit: transfer,
    getFees,
    importSignature,
    parseAminoMessageForDirectSigning,
    pubkeyToAddress: async (pubkey: Pubkey) => {
      const { pubkeyToAddress } = (await import("@cosmjs/amino")).default;
      return pubkeyToAddress(pubkey, chainPrefix);
    },
    secp256k1HdWalletFromMnemonic: secp256k1HdWalletFromMnemonic({
      derivationPath: derivationPathToString(derivationPath),
      prefix: chainPrefix,
    }),
    signMultisigTx: signMultisigTx(chain),
    signWithPrivateKey,
    transfer,
  };
}
