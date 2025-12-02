import { bitgo, networks } from "@bitgo/utxo-lib";
import type { UtxoPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import {
  Chain,
  type ChainSigner,
  type DerivationPathArray,
  derivationPathToString,
  FeeOption,
  NetworkDerivationPath,
  SwapKitError,
  updateDerivationPath,
} from "@swapkit/helpers";

import { accumulative, compileMemo, getUtxoApi, toCashAddress, toLegacyAddress } from "../helpers";
import type { TargetOutput, UTXOBuildTxParams, UTXOTransferParams, UTXOType } from "../types";
import type { UtxoToolboxParams } from "./params";
import { addressFromKeysGetter, createUTXOToolbox, getCreateKeysForPath } from "./utxo";
import { bchValidateAddress, stripPrefix } from "./validators";

type Psbt = UtxoPsbt;

const chain = Chain.BitcoinCash;
const network = networks.bitcoincash;

export function stripToCashAddress(address: string) {
  return stripPrefix(toCashAddress(address));
}

async function createSignerWithKeys({ phrase, derivationPath }: { phrase: string; derivationPath: string }) {
  const keyPair = (await getCreateKeysForPath(chain))({ derivationPath, phrase });

  async function signTransaction(psbt: Psbt) {
    await psbt.signAllInputs(keyPair);
    return psbt;
  }

  async function getAddress() {
    const addressGetter = await addressFromKeysGetter(chain);
    return addressGetter(keyPair);
  }

  return { getAddress, signTransaction };
}

export async function createBCHToolbox<T extends Chain.BitcoinCash>(
  toolboxParams: UtxoToolboxParams[T] | { phrase?: string; derivationPath?: DerivationPathArray; index?: number },
) {
  const phrase = "phrase" in toolboxParams ? toolboxParams.phrase : undefined;

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;

  const derivationPath = derivationPathToString(
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index }),
  );

  const signer = phrase
    ? await createSignerWithKeys({ derivationPath, phrase })
    : "signer" in toolboxParams
      ? toolboxParams.signer
      : undefined;

  function getAddress() {
    return Promise.resolve(signer?.getAddress());
  }

  const { getBalance, getFeeRates, broadcastTx, ...toolbox } = await createUTXOToolbox({ chain });

  function handleGetBalance(address: string, _scamFilter = true) {
    return getBalance(stripPrefix(toCashAddress(address)));
  }

  async function signTransaction(psbt: Psbt) {
    if (!signer) throw new SwapKitError("toolbox_utxo_no_signer");
    const signedTx = await signer.signTransaction(psbt);
    return signedTx;
  }

  async function signAndBroadcastTransaction(psbt: Psbt): Promise<string> {
    if (!signer) throw new SwapKitError("toolbox_utxo_no_signer");
    const signedTx = await signer.signTransaction(psbt);
    const txHex = signedTx.toHex();
    return broadcastTx(txHex);
  }

  return {
    ...toolbox,
    broadcastTx,
    // buildTx,
    createTransaction,
    getAddress,
    getAddressFromKeys,
    getBalance: handleGetBalance,
    getFeeRates,
    signAndBroadcastTransaction,
    signer,
    signTransaction,
    stripPrefix,
    stripToCashAddress,
    transfer: transfer({ broadcastTx, getFeeRates, signer }),
    validateAddress: bchValidateAddress,
  };
}

function transfer({
  broadcastTx,
  getFeeRates,
  signer,
}: {
  broadcastTx: (txHash: string) => Promise<string>;
  getFeeRates: () => Promise<Record<FeeOption, number>>;
  signer?: ChainSigner<Psbt, Psbt>;
}) {
  return async function transfer({
    recipient,
    assetValue,
    feeOptionKey = FeeOption.Fast,
    ...rest
  }: UTXOTransferParams) {
    const from = await signer?.getAddress();
    if (!(signer && from)) throw new SwapKitError("toolbox_utxo_no_signer");
    if (!recipient)
      throw new SwapKitError("toolbox_utxo_invalid_params", { error: "Recipient address must be provided" });

    const feeRate = rest.feeRate || (await getFeeRates())[feeOptionKey];

    // try out if psbt tx is faster/better/nicer
    const { psbt } = await createTransaction({ ...rest, assetValue, feeRate, recipient, sender: from });

    const tx = await signer.signTransaction(psbt);
    const txHex = tx.toHex();

    return broadcastTx(txHex);
  };
}

async function createTransaction({
  assetValue,
  recipient,
  memo,
  feeRate,
  sender,
  setSigHashType = true,
}: UTXOBuildTxParams & { setSigHashType?: boolean }) {
  const recipientCashAddress = toCashAddress(recipient);
  if (!bchValidateAddress(recipientCashAddress))
    throw new SwapKitError("toolbox_utxo_invalid_address", { address: recipientCashAddress });

  const targetValue = Math.ceil(assetValue.getBaseValue("number") + feeRate * 7500);

  const utxos = await getUtxoApi(chain).getUtxos({
    address: stripToCashAddress(sender),
    // Correctly fetch txHex for nonWitnessUtxo
    fetchTxHex: true,
    targetValue,
  });

  const feeRateWhole = Number(feeRate.toFixed(0));
  const compiledMemo = memo ? await compileMemo(memo) : null;
  const targetOutputs = [] as TargetOutput[];

  targetOutputs.push({ address: toLegacyAddress(recipient), value: assetValue.getBaseValue("number") });

  if (compiledMemo) {
    targetOutputs.push({ script: compiledMemo, value: 0 });
  }

  const { inputs, outputs } = accumulative({ chain, feeRate: feeRateWhole, inputs: utxos, outputs: targetOutputs });

  if (!(inputs && outputs)) throw new SwapKitError("toolbox_utxo_insufficient_balance", { assetValue, sender });

  const psbt = new bitgo.UtxoPsbt({ network }); // Network-specific

  for (const { hash, index, witnessUtxo } of inputs) {
    psbt.addInput({
      hash,
      index,
      sighashType: setSigHashType
        ? bitgo.UtxoTransaction.SIGHASH_ALL | bitgo.UtxoTransaction.SIGHASH_FORKID
        : undefined,
      ...(witnessUtxo && { witnessUtxo: { ...witnessUtxo, value: BigInt(witnessUtxo?.value) } }),
    });
  }

  for (const output of outputs) {
    const outAddress = "address" in output && output.address ? output.address : toLegacyAddress(sender);
    const params = output.script
      ? { script: output.script, value: 0n }
      : { address: outAddress, value: BigInt(output.value) };

    if (params) {
      psbt.addOutput(params);
    }
  }

  return { inputs: inputs as UTXOType[], psbt, utxos };
}

function getAddressFromKeys(keys: { getAddress: (index?: number) => string }) {
  const address = keys.getAddress(0);
  return stripToCashAddress(address);
}
