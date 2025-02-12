import {
  type Pubkey,
  Secp256k1HdWallet,
  createMultisigThresholdPubkey,
  encodeSecp256k1Pubkey,
  pubkeyToAddress,
} from "@cosmjs/amino";
import { Secp256k1, Secp256k1Signature, stringToPath } from "@cosmjs/crypto";
import type { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { type Account, makeMultisignedTxBytes } from "@cosmjs/stargate";
import { base64 } from "@scure/base";
import {
  type AssetValue,
  BaseDecimal,
  Chain,
  ChainId,
  DerivationPath,
  FeeOption,
  RequestClient,
  SwapKitError,
  SwapKitNumber,
} from "@swapkit/helpers";

import { CosmosClient } from "../cosmosClient";
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
  getRPC,
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
    msgs: msgs.map(parseAminoMessageForDirectSigning),
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
  stagenet,
}: ToolboxParams & {
  chain: Chain.THORChain | Chain.Maya;
}): ThorchainToolboxType => {
  const isThorchain = chain === Chain.THORChain;
  const isMaya = chain === Chain.Maya;
  const chainId = isThorchain ? ChainId.THORChain : ChainId.Maya;

  const prefix = `${stagenet ? "s" : ""}${chain.toLowerCase()}`;
  const derivationPath = DerivationPath[chain];
  const rpcUrl = getRPC(chainId, stagenet);
  const nodeUrl = stagenet
    ? isMaya
      ? "https://stagenet.mayanode.mayachain.info"
      : "https://stagenet-thornode.ninerealms.com"
    : isMaya
      ? "https://mayanode.mayachain.info"
      : "https://thornode.thorswap.net";

  const client = new CosmosClient({
    server: nodeUrl,
    chainId,
    prefix,
    stagenet,
  });
  const defaultFee = getDefaultChainFee(chain);

  const cosmosToolbox: {
    createPrivateKeyFromPhrase: (phrase: string) => Promise<Uint8Array>;
    getAccount: (address: string) => Promise<Account | null>;
    validateAddress: (address: string) => boolean;
    getAddressFromMnemonic: (phrase: string) => Promise<string>;
    getPubKeyFromMnemonic: (phrase: string) => Promise<string>;
    getBalance: (address: string, potentialScamFilter?: boolean) => Promise<AssetValue[]>;
    getSigner: (phrase: string) => Promise<OfflineDirectSigner>;
    getSignerFromPrivateKey: (privateKey: Uint8Array) => Promise<OfflineDirectSigner>;
  } = BaseCosmosToolbox({
    client,
    derivationPath,
    decimal: BaseDecimal[chain],
  });

  const loadAddressBalances = async (address: string) => {
    try {
      const balances: AssetValue[] = await cosmosToolbox.getBalance(address);

      return balances;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const getFees = async () => {
    let fee: SwapKitNumber;

    const constantsUrl = `${nodeUrl}/${isThorchain ? "thorchain" : "mayachain"}/constants}`;

    try {
      const {
        int_64_values: { NativeTransactionFee: nativeFee },
      } = await RequestClient.get<ThorchainConstantsResponse>(constantsUrl);

      // validate data
      if (!nativeFee || Number.isNaN(nativeFee) || nativeFee < 0)
        throw Error(`Invalid nativeFee: ${nativeFee.toString()}`);

      fee = new SwapKitNumber(nativeFee);
    } catch {
      fee = new SwapKitNumber({
        value: isThorchain ? 0.02 : 1,
        decimal: BaseDecimal[chain],
      });
    }

    return {
      [FeeOption.Average]: fee,
      [FeeOption.Fast]: fee,
      [FeeOption.Fastest]: fee,
    };
  };

  const transfer = async ({
    from,
    recipient,
    assetValue,
    memo = "",
    signer,
  }: Omit<TransferParams, "recipient"> & { recipient?: string }) => {
    if (!signer) throw new Error("Signer not defined");

    const isAminoSigner = "signAmino" in signer;
    const registry = createDefaultRegistry();
    const aminoTypes = createDefaultAminoTypes(chain);
    const signingClient = await createSigningStargateClient(rpcUrl, signer, {
      registry,
      aminoTypes,
    });

    const aminoMessage = buildAminoMsg({ assetValue, from, recipient, memo, chain });

    const preparedMessage = isAminoSigner
      ? aminoMessage
      : parseAminoMessageForDirectSigning(aminoMessage);

    const msgSign = convertToSignable(preparedMessage, chain);

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
    prepareMessageForBroadcast: parseAminoMessageForDirectSigning,
    parseAminoMessageForDirectSigning,
    createDefaultAminoTypes: () => createDefaultAminoTypes(chain),
    createDefaultRegistry,
    secp256k1HdWalletFromMnemonic: secp256k1HdWalletFromMnemonic({
      derivationPath,
      prefix,
    }),
    signMultisigTx: (wallet: Secp256k1HdWallet, tx: string) => signMultisigTx(wallet, tx, chain),
    broadcastMultisigTx: broadcastMultisigTx({ prefix, rpcUrl }),
    createMultisig,
    importSignature,
    loadAddressBalances,
    pubkeyToAddress: __REEXPORT__pubkeyToAddress(prefix),
    signWithPrivateKey,
    verifySignature: verifySignature(cosmosToolbox.getAccount),
  };
};

export const ThorchainToolbox = ({ stagenet }: ToolboxParams = {}): ThorchainToolboxType => {
  return BaseThorchainToolbox({ chain: Chain.THORChain, stagenet });
};

export const MayaToolbox = ({ stagenet }: ToolboxParams = {}): MayaToolboxType => {
  return BaseThorchainToolbox({ chain: Chain.Maya, stagenet });
};

export type ThorchainWallet = Omit<ReturnType<typeof BaseThorchainToolbox>, "signMessage">;
export type ThorchainWallets = {
  [chain in Chain.THORChain | Chain.Maya]: ThorchainWallet;
};
