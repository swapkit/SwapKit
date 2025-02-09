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
  NODE_URLS,
  RPC_URLS,
  RequestClient,
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
import type { Signer, ToolboxParams, TransferParams } from "../types";
import {
  createOfflineStargateClient,
  createSigningStargateClient,
  createStargateClient,
  getDefaultChainFee,
} from "../util";

import { BaseCosmosToolbox } from "./BaseCosmosToolbox";

const secp256k1HdWalletFromMnemonic =
  ({ prefix, derivationPath }: { prefix: string; derivationPath: string }) =>
  (mnemonic: string, index = 0) => {
    return Secp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath(`${derivationPath}/${index}`)],
      prefix,
    });
  };

const exportSignature = (signature: Uint8Array) => base64.encode(signature);

const signMultisigTx = async (
  wallet: Secp256k1HdWallet,
  tx: string,
  chain: Chain.THORChain | Chain.Maya,
) => {
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
  const aminoTypes = await createDefaultAminoTypes(chain);
  const registry = await createDefaultRegistry();
  const signingClient = await createOfflineStargateClient(wallet, {
    registry,
    aminoTypes,
  });

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

  const bodyBytes = await buildEncodedTxBody({
    chain,
    msgs: msgs.map(prepareMessageForBroadcast),
    memo,
  });

  return { signature: exportSignature(signature as Uint8Array), bodyBytes };
};

const broadcastMultisigTx =
  ({ prefix, rpcUrl }: { prefix: string; rpcUrl: string }) =>
  async (
    tx: string,
    signers: Signer[],
    membersPubKeys: string[],
    threshold: number,
    bodyBytes: Uint8Array,
  ) => {
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

const createMultisig = async (pubKeys: string[], threshold: number, noSortPubKeys = true) => {
  return createMultisigThresholdPubkey(
    pubKeys.map((pubKey) => encodeSecp256k1Pubkey(base64.decode(pubKey))),
    threshold,
    noSortPubKeys,
  );
};

const importSignature = (signature: string) => base64.decode(signature);

const __REEXPORT__pubkeyToAddress = (prefix: string) => (pubkey: Pubkey) => {
  return pubkeyToAddress(pubkey, prefix);
};

const signWithPrivateKey = async ({
  privateKey,
  message,
}: {
  privateKey: Uint8Array;
  message: string;
}) => {
  const signature = await Secp256k1.createSignature(base64.decode(message), privateKey);
  return base64.encode(Buffer.concat([signature.r(32), signature.s(32)]));
};

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

export const BaseThorchainToolbox = ({
  chain,
  prefix,
  nodeUrl,
  rpcUrl,
}: ToolboxParams & {
  chain: Chain.THORChain | Chain.Maya;
  nodeUrl: string;
  rpcUrl: string;
}): ThorchainToolboxType => {
  const isThorchain = chain === Chain.THORChain;
  const chainPrefix = prefix || CosmosChainPrefixes[chain];
  const derivationPath = DerivationPath[chain];

  const cosmosToolbox = BaseCosmosToolbox({ chain, derivationPath, prefix: chainPrefix, rpcUrl });
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

    const constantsUrl = `${nodeUrl}/${isThorchain ? "thorchain" : "mayachain"}/constants}`;

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

  const transfer = async ({
    from,
    recipient,
    assetValue,
    memo = "",
    signer,
  }: Omit<TransferParams, "recipient"> & { recipient?: string }) => {
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
  };

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
};

export const ThorchainToolbox = ({
  prefix,
  rpcUrl,
  nodeUrl,
}: ToolboxParams & { nodeUrl?: string } = {}): ThorchainToolboxType => {
  const chain = Chain.THORChain;

  return BaseThorchainToolbox({
    chain,
    prefix,
    rpcUrl: rpcUrl || RPC_URLS[chain],
    nodeUrl: nodeUrl || NODE_URLS[chain],
  });
};

export const MayaToolbox = ({
  prefix,
  rpcUrl,
  nodeUrl,
}: ToolboxParams & { nodeUrl?: string } = {}): MayaToolboxType => {
  const chain = Chain.Maya;

  return BaseThorchainToolbox({
    chain,
    prefix,
    rpcUrl: rpcUrl || RPC_URLS[chain],
    nodeUrl: nodeUrl || NODE_URLS[chain],
  });
};

export type ThorchainWallet = Omit<ReturnType<typeof BaseThorchainToolbox>, "signMessage">;
export type ThorchainWallets = {
  [chain in Chain.THORChain | Chain.Maya]: ThorchainWallet;
};
