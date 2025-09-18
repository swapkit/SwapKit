import { bitgo, crypto, ECPair, networks, address as zcashAddress } from "@bitgo/utxo-lib";
import type { ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import {
  Chain,
  type ChainSigner,
  type DerivationPathArray,
  derivationPathToString,
  FeeOption,
  NetworkDerivationPath,
  SKConfig,
  SwapKitError,
  updateDerivationPath,
} from "@swapkit/helpers";
import bs58check from "bs58check";
import { match, P } from "ts-pattern";
import { accumulative, compileMemo, getUtxoApi } from "../helpers";
import type { TargetOutput, UTXOBuildTxParams, UTXOTransferParams, UTXOType } from "../types";
import { createUTXOToolbox } from "./utxo";
import { validateZcashAddress } from "./validators";

function getZcashNetwork() {
  return networks.zcash;
}

function getECPairNetwork() {
  return {
    bech32: undefined,
    bip32: { private: 0x0488ade4, public: 0x0488b21e },
    messagePrefix: "\x18ZCash Signed Message:\n",
    pubKeyHash: 0x1c,
    scriptHash: 0x1c,
    wif: 0x80,
  };
}

type ZcashSigner = ChainSigner<ZcashPsbt, ZcashPsbt>;

function createZcashSignerFromPhrase({
  phrase,
  derivationPath,
}: {
  phrase: string;
  derivationPath: string;
}): ZcashSigner {
  const seed = mnemonicToSeedSync(phrase);
  const root = HDKey.fromMasterSeed(seed);
  const node = root.derive(derivationPath);

  if (!node.privateKey) {
    throw new SwapKitError("toolbox_utxo_invalid_params");
  }

  // Create key pair using BitGo's ECPair with ECPair-compatible network
  const ecpairNetwork = getECPairNetwork();
  const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network: ecpairNetwork });

  const pubKeyHash = crypto.hash160(keyPair.publicKey);
  const { isStagenet } = SKConfig.get("envs");

  const prefix = isStagenet
    ? Buffer.from([0x1d, 0x25]) // testnet prefix (results in tm... addresses)
    : Buffer.from([0x1c, 0xb8]); // mainnet prefix (results in t1... addresses)

  const payload = Buffer.concat([prefix, pubKeyHash]);

  const address = bs58check.encode(payload);

  return {
    getAddress: () => Promise.resolve(address),

    signTransaction: (psbt) => {
      const signedPsbt = psbt.signAllInputs(keyPair);

      return Promise.resolve(signedPsbt);
    },
  };
}

function addInputsAndOutputs({
  inputs,
  outputs,
  psbt,
  sender,
  compiledMemo,
}: {
  inputs: UTXOType[];
  outputs: TargetOutput[];
  psbt: ZcashPsbt;
  sender: string;
  compiledMemo: Buffer<ArrayBufferLike> | null;
}) {
  for (const utxo of inputs) {
    const witnessInfo = !!utxo.witnessUtxo && { witnessUtxo: { ...utxo.witnessUtxo, value: BigInt(utxo.value) } };

    const nonWitnessInfo = !utxo.witnessUtxo && {
      nonWitnessUtxo: utxo.txHex ? Buffer.from(utxo.txHex, "hex") : undefined,
    };

    psbt.addInput({ hash: utxo.hash, index: utxo.index, ...witnessInfo, ...nonWitnessInfo });
  }

  for (const output of outputs) {
    const address = "address" in output && output.address ? output.address : sender;
    const hasOutputScript = output.script;

    if (hasOutputScript && !compiledMemo) {
      continue;
    }

    const mappedOutput = hasOutputScript
      ? { script: compiledMemo as Buffer<ArrayBufferLike>, value: 0n }
      : { script: zcashAddress.toOutputScript(address, getZcashNetwork()), value: BigInt(output.value) };

    psbt.addOutput(mappedOutput);
  }

  return { inputs, psbt };
}

async function createTransaction(buildTxParams: UTXOBuildTxParams) {
  const { assetValue, recipient, memo, feeRate, sender, fetchTxHex } = buildTxParams;

  const compiledMemo = memo ? compileMemo(memo) : null;

  const utxos = await getUtxoApi(Chain.Zcash).getUtxos({ address: sender, fetchTxHex: fetchTxHex !== false });

  const targetOutputs = [
    { address: recipient, value: Number(assetValue.getBaseValue("string")) },
    ...(compiledMemo ? [{ script: compiledMemo, value: 0 }] : []),
  ];

  const { inputs, outputs } = accumulative({
    chain: Chain.Zcash,
    changeAddress: sender, // Overwrite change address to sender
    feeRate,
    inputs: utxos,
    outputs: targetOutputs,
  });

  if (!(inputs && outputs)) {
    throw new SwapKitError("toolbox_utxo_insufficient_balance", { assetValue, sender });
  }

  const psbt = bitgo.createPsbtForNetwork({ network: getZcashNetwork() }, { version: 500 }) as ZcashPsbt;

  const NU6 = 0xc8e71055;
  //   const NU5 = 0xc2d6d0b4;
  //   const branchId = tipHeight >= 2726400 ? NU6 : tipHeight >= 1687104 ? NU5 : NU5;
  const branchId = NU6;

  const CONSENSUS_BRANCH_ID_KEY = Buffer.concat([Buffer.of(0xfc), Buffer.of(0x05), Buffer.from("BITGO"), Buffer.of(0)]);

  // PSBT value must be 4-byte little-endian
  const value = Buffer.allocUnsafe(4);
  value.writeUInt32LE(branchId >>> 0, 0);

  psbt.addUnknownKeyValToGlobal({ key: CONSENSUS_BRANCH_ID_KEY, value });

  const { psbt: mappedPsbt, inputs: mappedInputs } = await addInputsAndOutputs({
    compiledMemo,
    inputs,
    outputs,
    psbt,
    sender,
  });

  return { inputs: mappedInputs, outputs, psbt: mappedPsbt };
}

export async function createZcashToolbox(
  toolboxParams: { signer?: ZcashSigner } | { phrase?: string; derivationPath?: DerivationPathArray; index?: number },
) {
  const signer = await match(toolboxParams)
    .with({ signer: P.not(P.nullish) }, ({ signer }) => Promise.resolve(signer))
    .with({ phrase: P.string }, ({ phrase, derivationPath, index = 0 }) => {
      const baseDerivationPath = derivationPath || NetworkDerivationPath[Chain.Zcash] || [44, 133, 0, 0, 0];
      const updatedPath = updateDerivationPath(baseDerivationPath, { index });
      const pathString = derivationPathToString(updatedPath);

      return createZcashSignerFromPhrase({ derivationPath: pathString, phrase });
    })
    .otherwise(() => Promise.resolve(undefined));

  const baseToolbox = await createUTXOToolbox({ chain: Chain.Zcash, signer });

  async function transfer({ recipient, assetValue, feeOptionKey = FeeOption.Fast, ...rest }: UTXOTransferParams) {
    const from = await signer?.getAddress();
    if (!(signer && from)) {
      throw new SwapKitError("toolbox_utxo_no_signer");
    }

    const feeRate = rest.feeRate || (await baseToolbox.getFeeRates())[feeOptionKey];

    const { psbt } = await createTransaction({ ...rest, assetValue, feeRate, recipient, sender: from });

    const signedPsbt = await signer.signTransaction(psbt);

    signedPsbt.finalizeAllInputs();

    return baseToolbox.broadcastTx(signedPsbt.extractTransaction().toHex());
  }

  function createKeysForPath({
    phrase,
    derivationPath = "m/44'/133'/0'/0/0",
  }: {
    phrase: string;
    derivationPath?: string;
  }) {
    const seed = mnemonicToSeedSync(phrase);
    const root = HDKey.fromMasterSeed(seed);
    const node = root.derive(derivationPath);

    if (!node.privateKey) {
      throw new SwapKitError("toolbox_utxo_invalid_params");
    }

    const ecpairNetwork = getECPairNetwork();
    const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network: ecpairNetwork });

    return keyPair;
  }

  function getPrivateKeyFromMnemonic({
    phrase,
    derivationPath = "m/44'/133'/0'/0/0",
  }: {
    phrase: string;
    derivationPath: string;
  }) {
    const keys = createKeysForPath({ derivationPath, phrase });
    return keys.toWIF();
  }

  return {
    ...baseToolbox,
    createKeysForPath,
    createTransaction,
    getPrivateKeyFromMnemonic,
    transfer,
    validateAddress: validateZcashAddress,
  };
}
