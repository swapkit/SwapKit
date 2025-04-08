import type { Pubkey, Secp256k1HdWallet } from "@cosmjs/amino";
import { base64 } from "@scure/base";
import {
  BaseDecimal,
  Chain,
  CosmosChainPrefixes,
  DerivationPath,
  FeeOption,
  RequestClient,
  SKConfig,
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
  parseAminoMessageForDirectSigning,
} from "../thorchainUtils";
import type { ThorchainConstantsResponse } from "../thorchainUtils/types/client-types";
import type { MultisigTx } from "../types";
import type { CosmosToolboxParams, MultiSigSigner, TransferParams } from "../types";
import {
  createOfflineStargateClient,
  createSigningStargateClient,
  createStargateClient,
  getDefaultChainFee,
} from "../util";
import { createCosmosToolbox } from "./cosmos";

function secp256k1HdWalletFromMnemonic({
  prefix,
  derivationPath,
}: {
  prefix: string;
  derivationPath: string;
}) {
  return async function secp256k1HdWalletFromMnemonic(mnemonic: string, index = 0) {
    const { Secp256k1HdWallet } = await import("@cosmjs/amino");
    const { stringToPath } = await import("@cosmjs/crypto");

    return Secp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath(`${derivationPath}/${index}`)],
      prefix,
    });
  };
}

function exportSignature(signature: Uint8Array) {
  return base64.encode(signature);
}

function signMultisigTx(chain: Chain.THORChain | Chain.Maya) {
  return async function signMultisigTx({
    wallet,
    tx,
  }: {
    wallet: Secp256k1HdWallet;
    tx: string | MultisigTx;
  }) {
    const { msgs, accountNumber, sequence, chainId, fee, memo } =
      typeof tx === "string" ? JSON.parse(tx) : tx;

    const address = (await wallet.getAccounts())?.[0]?.address || "";
    const aminoTypes = await createDefaultAminoTypes(chain);
    const registry = await createDefaultRegistry();
    const signingClient = await createOfflineStargateClient(wallet, {
      registry,
      aminoTypes,
    });
    const msgForSigning = [];

    for (const msg of msgs) {
      const signMsg = await convertToSignable(msg, chain);
      msgForSigning.push(signMsg);
    }

    const {
      signatures: [signature],
    } = await signingClient.sign(address, msgForSigning, fee, memo, {
      accountNumber,
      sequence,
      chainId,
    });

    const bodyBytes = await buildEncodedTxBody({
      chain,
      memo,
      msgs: msgs.map(parseAminoMessageForDirectSigning),
    });

    return { signature: exportSignature(signature as Uint8Array), bodyBytes };
  };
}

function broadcastMultisigTx({
  prefix,
  rpcUrl,
}: {
  prefix: string;
  rpcUrl: string;
}) {
  return async function broadcastMultisigTx(
    tx: string,
    signers: MultiSigSigner[],
    membersPubKeys: string[],
    threshold: number,
    bodyBytes: Uint8Array,
  ) {
    const { encodeSecp256k1Pubkey, pubkeyToAddress } = await import("@cosmjs/amino");
    const { makeMultisignedTxBytes } = await import("@cosmjs/stargate");

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
  const { createMultisigThresholdPubkey, encodeSecp256k1Pubkey } = await import("@cosmjs/amino");
  return createMultisigThresholdPubkey(
    pubKeys.map((pubKey) => encodeSecp256k1Pubkey(base64.decode(pubKey))),
    threshold,
    noSortPubKeys,
  );
}

function importSignature(signature: string) {
  return base64.decode(signature);
}

async function signWithPrivateKey({
  privateKey,
  message,
}: {
  privateKey: Uint8Array;
  message: string;
}) {
  const { Secp256k1 } = await import("@cosmjs/crypto");

  const signature = await Secp256k1.createSignature(base64.decode(message), privateKey);
  return base64.encode(Buffer.concat([signature.r(32), signature.s(32)]));
}

export function createThorchainToolbox({
  chain,
  derivationPath: paramsDerivationPath,
  index = 0,
  signer,
}: Omit<CosmosToolboxParams, "chain"> & { chain: Chain.THORChain | Chain.Maya }) {
  const nodeUrl = SKConfig.get("nodeUrls")[chain];
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const { isStagenet } = SKConfig.get("envs");

  const isThorchain = chain === Chain.THORChain;
  const chainPrefix = `${isStagenet ? "s" : ""}${CosmosChainPrefixes[chain]}`;
  const derivationPath = paramsDerivationPath || DerivationPath[chain];

  const cosmosToolbox = createCosmosToolbox({
    chain,
    derivationPath,
    signer,
    index,
  });
  const defaultFee = getDefaultChainFee(chain);

  async function getFees() {
    let fee: SwapKitNumber;

    const constantsUrl = `${nodeUrl}/${isThorchain ? "thorchain" : "mayachain"}/constants`;

    try {
      const {
        int_64_values: { NativeTransactionFee: nativeFee },
      } = await RequestClient.get<ThorchainConstantsResponse>(constantsUrl);

      if (!nativeFee || Number.isNaN(nativeFee) || nativeFee < 0) {
        throw new Error(`Invalid nativeFee: ${nativeFee.toString()}`);
      }

      fee = new SwapKitNumber(nativeFee);
    } catch {
      fee = new SwapKitNumber({
        value: isThorchain ? 0.02 : 1,
        decimal: BaseDecimal[chain],
      });
    }

    return { [FeeOption.Average]: fee, [FeeOption.Fast]: fee, [FeeOption.Fastest]: fee };
  }

  async function transfer({
    assetValue,
    from,
    memo = "",
    recipient,
  }: Omit<TransferParams, "recipient"> & { recipient?: string }) {
    const { TxRaw } = await import("cosmjs-types/cosmos/tx/v1beta1/tx");
    if (!signer) throw new Error("Signer not defined");

    const isAminoSigner = "signAmino" in signer;
    const registry = await createDefaultRegistry();
    const aminoTypes = await createDefaultAminoTypes(chain);
    const signingClient = await createSigningStargateClient(rpcUrl, signer, {
      registry,
      aminoTypes,
    });

    const aminoMessage = buildAminoMsg({
      assetValue,
      from,
      recipient,
      memo,
      chain,
    });

    if (isAminoSigner) {
      const msgSign = await convertToSignable(aminoMessage, chain);

      const { signatures, authInfoBytes } = await signingClient.sign(
        from,
        [msgSign],
        defaultFee,
        memo,
      );

      const tx = TxRaw.encode({
        signatures,
        authInfoBytes,
        bodyBytes: await buildEncodedTxBody({
          chain,
          msgs: [aminoMessage].map(parseAminoMessageForDirectSigning),
          memo,
        }),
      }).finish();

      const txResponse = await signingClient.broadcastTx(tx);

      return txResponse.transactionHash;
    }

    const preparedMessage = parseAminoMessageForDirectSigning(aminoMessage);
    const msgSign = await convertToSignable(preparedMessage, chain);
    const txResponse = await signingClient.signAndBroadcast(from, [msgSign], defaultFee, memo);

    return txResponse.transactionHash;
  }

  return {
    ...cosmosToolbox,
    broadcastMultisigTx: broadcastMultisigTx({ prefix: chainPrefix, rpcUrl }),
    buildAminoMsg,
    buildDepositTx: buildDepositTx(rpcUrl),
    buildEncodedTxBody,
    buildTransferTx: buildTransferTx(rpcUrl),
    convertToSignable,
    createDefaultAminoTypes: () => createDefaultAminoTypes(chain),
    createDefaultRegistry,
    createMultisig,
    deposit: transfer,
    getFees,
    importSignature,
    parseAminoMessageForDirectSigning,
    secp256k1HdWalletFromMnemonic: secp256k1HdWalletFromMnemonic({
      derivationPath,
      prefix: chainPrefix,
    }),
    signMultisigTx: signMultisigTx(chain),
    signWithPrivateKey,
    transfer,
    pubkeyToAddress: async (pubkey: Pubkey) => {
      const { pubkeyToAddress } = await import("@cosmjs/amino");
      return pubkeyToAddress(pubkey, chainPrefix);
    },
  };
}
