import type { Pubkey, Secp256k1HdWallet } from "@cosmjs/amino";
import type { Account } from "@cosmjs/stargate";
import { base64 } from "@scure/base";
import {
  BaseDecimal,
  Chain,
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
  parseAminoMessageForDirectSigning,
} from "../thorchainUtils/index";
import type { ThorchainConstantsResponse } from "../thorchainUtils/types/client-types";
import type { MultisigTx, Signer, TransferParams } from "../types";
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
  }: { wallet: Secp256k1HdWallet; tx: string | MultisigTx }) {
    const { msgs, accountNumber, sequence, chainId, fee, memo } =
      typeof tx === "string" ? JSON.parse(tx) : tx;

    const address = (await wallet.getAccounts())?.[0]?.address || "";
    const aminoTypes = await createDefaultAminoTypes(chain);
    const registry = await createDefaultRegistry();
    const signingClient = await createOfflineStargateClient(wallet, { registry, aminoTypes });
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

function broadcastMultisigTx({ prefix, rpcUrl }: { prefix: string; rpcUrl: string }) {
  return async function broadcastMultisigTx(
    tx: string,
    signers: Signer[],
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
}: { privateKey: Uint8Array; message: string }) {
  const { Secp256k1 } = await import("@cosmjs/crypto");

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
    const { Secp256k1Signature, Secp256k1 } = await import("@cosmjs/crypto");

    const secpSignature = Secp256k1Signature.fromFixedLength(base64.decode(signature));
    return Secp256k1.verifySignature(secpSignature, base64.decode(message), account.pubkey.value);
  };
}

export function BaseThorchainToolbox(chain: Chain.THORChain | Chain.Maya) {
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
        throw new Error(`Invalid nativeFee: ${nativeFee.toString()}`);
      }

      fee = new SwapKitNumber(nativeFee);
    } catch {
      fee = new SwapKitNumber({ value: isThorchain ? 0.02 : 1, decimal: BaseDecimal[chain] });
    }

    return { [FeeOption.Average]: fee, [FeeOption.Fast]: fee, [FeeOption.Fastest]: fee };
  }

  async function transfer({
    assetValue,
    from,
    memo = "",
    recipient,
    signer,
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

    const aminoMessage = buildAminoMsg({ assetValue, from, recipient, memo, chain });

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
    loadAddressBalances,
    parseAminoMessageForDirectSigning,
    secp256k1HdWalletFromMnemonic: secp256k1HdWalletFromMnemonic({
      derivationPath,
      prefix: chainPrefix,
    }),
    signMultisigTx: signMultisigTx(chain),
    signWithPrivateKey,
    transfer,
    verifySignature: verifySignature(cosmosToolbox.getAccount),
    pubkeyToAddress: async (pubkey: Pubkey) => {
      const { pubkeyToAddress } = await import("@cosmjs/amino");
      return pubkeyToAddress(pubkey, chainPrefix);
    },
  };
}

export function ThorchainToolbox() {
  return BaseThorchainToolbox(Chain.THORChain);
}

export function MayaToolbox() {
  return BaseThorchainToolbox(Chain.Maya);
}

export type ThorchainWallet = Omit<ReturnType<typeof BaseThorchainToolbox>, "signMessage">;
export type ThorchainWallets = {
  [chain in Chain.THORChain | Chain.Maya]: ThorchainWallet;
};
