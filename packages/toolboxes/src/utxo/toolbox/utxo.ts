import { AssetValue, Chain, FeeOption, SwapKitNumber, type UTXOChain } from "@swapkit/helpers";
import type { Psbt } from "bitcoinjs-lib";
import type { ECPairInterface } from "ecpair";

import { getBalance } from "../../utils";
import {
  UTXOScriptType,
  accumulative,
  calculateTxSize,
  compileMemo,
  getDustThreshold,
  getInputSize,
  getUtxoApi,
  getUtxoNetwork,
} from "../helpers";
import type { TargetOutput, UTXOBuildTxParams, UTXOType, UTXOWalletTransferParams } from "../types";
import { validateAddress as validateBCHAddress } from "./bitcoinCash";

export const nonSegwitChains = [Chain.Dash, Chain.Dogecoin];

export function buildTx(chain: UTXOChain) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: refactor
  return async function buildTx({
    assetValue,
    recipient,
    memo,
    feeRate,
    sender,
    fetchTxHex = false,
  }: UTXOBuildTxParams): Promise<{
    psbt: Psbt;
    utxos: UTXOType[];
    inputs: UTXOType[];
  }> {
    const secp256k1 = await import("@bitcoinerlab/secp256k1");
    const { initEccLib, Psbt } = await import("bitcoinjs-lib");
    const compiledMemo = memo ? await compileMemo(memo) : null;
    const getInputsAndOutputs = getInputsAndTargetOutputs(chain);

    const inputsAndOutputs = await getInputsAndOutputs({
      assetValue,
      recipient,
      memo,
      sender,
      fetchTxHex,
    });

    const { inputs, outputs } = accumulative({ ...inputsAndOutputs, feeRate, chain });

    // .inputs and .outputs will be undefined if no solution was found
    if (!(inputs && outputs)) throw new Error("Insufficient Balance for transaction");
    const getNetwork = await getUtxoNetwork();
    const psbt = new Psbt({ network: getNetwork(chain) });

    if (chain === Chain.Dogecoin) psbt.setMaximumFeeRate(650000000);

    for (const utxo of inputs) {
      const witnessInfo = !!utxo.witnessUtxo &&
        !nonSegwitChains.includes(chain) && { witnessUtxo: utxo.witnessUtxo };

      const nonWitnessInfo = nonSegwitChains.includes(chain) && {
        nonWitnessUtxo: utxo.txHex ? Buffer.from(utxo.txHex, "hex") : undefined,
      };

      psbt.addInput({ hash: utxo.hash, index: utxo.index, ...witnessInfo, ...nonWitnessInfo });
    }

    for (const output of outputs) {
      const address = "address" in output && output.address ? output.address : sender;
      const params = output.script
        ? compiledMemo
          ? { script: compiledMemo, value: 0 }
          : undefined
        : { address, value: output.value };

      if (params) {
        initEccLib(secp256k1);
        psbt.addOutput(params);
      }
    }

    return { psbt, utxos: inputsAndOutputs.inputs, inputs };
  };
}

export async function getAddressValidator() {
  const secp256k1 = await import("@bitcoinerlab/secp256k1");
  const { initEccLib, address: btcLibAddress } = await import("bitcoinjs-lib");
  const getNetwork = await getUtxoNetwork();

  return function validateAddress({ chain, address }: { chain: UTXOChain; address: string }) {
    if (chain === Chain.BitcoinCash) {
      return validateBCHAddress(address);
    }

    return function validateAddress(address: string) {
      try {
        initEccLib(secp256k1);
        btcLibAddress.toOutputScript(address, getNetwork(chain));
        return true;
      } catch (_error) {
        return false;
      }
    };
  };
}

export async function createUTXOToolbox(chain: UTXOChain) {
  const getAddressFromKeys = await addressFromKeysGetter(chain);
  const validateAddress = await getAddressValidator();
  const createKeysForPath = await getCreateKeysForPath(chain);

  return function createUTXOToolbox() {
    return {
      accumulative,
      calculateTxSize,
      getAddressFromKeys,
      validateAddress: (address: string) => validateAddress({ chain, address }),
      broadcastTx: (txHash: string) => getUtxoApi(chain).broadcastTx(txHash),
      buildTx: buildTx(chain),
      createKeysForPath,
      getFeeRates: () => getFeeRates(chain),
      getInputsOutputsFee: getInputsOutputsFee(chain),
      transfer: transfer(chain),
      getPrivateKeyFromMnemonic: (params: { phrase: string; derivationPath: string }) => {
        const keys = createKeysForPath(params);
        return keys.toWIF();
      },

      getBalance: getBalance(chain),
      estimateTransactionFee: estimateTransactionFee(chain),
      estimateMaxSendableAmount: estimateMaxSendableAmount(chain),
    };
  };
}

function getInputsOutputsFee(chain: UTXOChain) {
  return async function getInputsOutputsFee({
    assetValue,
    feeOptionKey = FeeOption.Fast,
    feeRate,
    fetchTxHex = false,
    memo,
    recipient,
    from,
  }: {
    assetValue: AssetValue;
    recipient: string;
    memo?: string;
    from: string;
    feeOptionKey?: FeeOption;
    feeRate?: number;
    fetchTxHex?: boolean;
  }) {
    const getInputsAndOutputs = getInputsAndTargetOutputs(chain);
    const inputsAndOutputs = await getInputsAndOutputs({
      assetValue,
      recipient,
      memo,
      sender: from,
      fetchTxHex,
    });

    const feeRateWhole = feeRate ? Math.floor(feeRate) : (await getFeeRates(chain))[feeOptionKey];

    return accumulative({ ...inputsAndOutputs, feeRate: feeRateWhole, chain });
  };
}

function estimateMaxSendableAmount(chain: UTXOChain) {
  return async function estimateMaxSendableAmount({
    from,
    memo,
    feeRate,
    feeOptionKey = FeeOption.Fast,
    recipients = 1,
  }: {
    from: string;
    memo?: string;
    feeRate?: number;
    feeOptionKey?: FeeOption;
    recipients?: number | TargetOutput[];
  }) {
    const addressData = await getUtxoApi(chain).getAddressData(from);
    const feeRateWhole = feeRate ? Math.ceil(feeRate) : (await getFeeRates(chain))[feeOptionKey];

    const inputs = addressData?.utxo
      .map((utxo) => ({
        ...utxo,
        // type: utxo.witnessUtxo ? UTXOScriptType.P2WPKH : UTXOScriptType.P2PKH,
        type: UTXOScriptType.P2PKH,
        hash: "",
      }))
      .filter(
        (utxo) => utxo.value > Math.max(getDustThreshold(chain), getInputSize(utxo) * feeRateWhole),
      );

    if (!inputs?.length) return AssetValue.from({ chain });

    const balance = AssetValue.from({
      chain,
      value: inputs.reduce((sum, utxo) => sum + utxo.value, 0),
    });

    const outputs =
      typeof recipients === "number"
        ? (Array.from({ length: recipients }, () => ({
            address: from,
            value: 0,
          })) as TargetOutput[])
        : recipients;

    if (memo) {
      const script = await compileMemo(memo);
      outputs.push({ address: from, script, value: 0 });
    }

    const txSize = calculateTxSize({ inputs, outputs, feeRate: feeRateWhole });

    const fee = txSize * feeRateWhole;

    return balance.sub(fee);
  };
}

function estimateTransactionFee(chain: UTXOChain) {
  return async (params: {
    assetValue: AssetValue;
    recipient: string;
    from: string;
    memo?: string;
    feeOptionKey?: FeeOption;
    feeRate?: number;
    fetchTxHex?: boolean;
  }) => {
    const getInputsFee = getInputsOutputsFee(chain);
    const inputFees = await getInputsFee(params);

    return AssetValue.from({
      chain,
      value: SwapKitNumber.fromBigInt(BigInt(inputFees.fee), 8).getValue("string"),
    });
  };
}

async function getCreateKeysForPath(chain: Chain) {
  const { ECPairFactory } = await import("ecpair");
  const secp256k1 = await import("@bitcoinerlab/secp256k1");
  const { HDKey } = await import("@scure/bip32");
  const { mnemonicToSeedSync } = await import("@scure/bip39");
  const getNetwork = await getUtxoNetwork();

  return function createKeysForPath({
    phrase,
    wif,
    derivationPath,
  }: { phrase?: string; wif?: string; derivationPath: string }) {
    if (!(wif || phrase)) throw new Error("Either phrase or wif must be provided");

    const factory = ECPairFactory(secp256k1);
    const network = getNetwork(chain);

    if (wif) return factory.fromWIF(wif, network);

    const seed = mnemonicToSeedSync(phrase as string);
    const master = HDKey.fromMasterSeed(seed, network).derive(derivationPath);
    if (!master.privateKey) throw new Error("Could not get private key from phrase");

    return factory.fromPrivateKey(Buffer.from(master.privateKey), { network });
  };
}

async function addressFromKeysGetter(chain: UTXOChain) {
  const { payments } = await import("bitcoinjs-lib");
  const getNetwork = await getUtxoNetwork();

  return function getAddressFromKeys(keys: ECPairInterface) {
    if (!keys) throw new Error("Keys must be provided");

    const method = nonSegwitChains.includes(chain) ? payments.p2pkh : payments.p2wpkh;
    const { address } = method({ pubkey: keys.publicKey as Buffer, network: getNetwork(chain) });
    if (!address) throw new Error("Address not defined");

    return address;
  };
}

function transfer(chain: UTXOChain) {
  return async function transfer({
    signTransaction,
    from,
    memo,
    recipient,
    feeOptionKey,
    feeRate,
    assetValue,
  }: UTXOWalletTransferParams<Psbt, Psbt>) {
    if (!from) throw new Error("From address must be provided");
    if (!recipient) throw new Error("Recipient address must be provided");
    if (!signTransaction) throw new Error("Sign transaction must be provided");
    const txFeeRate = feeRate || (await getFeeRates(chain))[feeOptionKey || FeeOption.Fast];

    const { psbt } = await buildTx(chain)({
      recipient,
      feeRate: txFeeRate,
      sender: from,
      fetchTxHex: nonSegwitChains.includes(chain),
      assetValue,
      memo,
    });
    const signedPsbt = await signTransaction(psbt);
    signedPsbt.finalizeAllInputs(); // Finalise inputs
    // TX extracted and formatted to hex
    return getUtxoApi(chain).broadcastTx(signedPsbt.extractTransaction().toHex());
  };
}

async function getFeeRates(chain: UTXOChain) {
  const suggestedFeeRate = await getUtxoApi(chain).getSuggestedTxFee();

  return {
    [FeeOption.Average]: suggestedFeeRate,
    [FeeOption.Fast]: suggestedFeeRate * 1.5,
    [FeeOption.Fastest]: suggestedFeeRate * 2.0,
  };
}

function getInputsAndTargetOutputs(chain: UTXOChain) {
  return async function getInputsAndTargetOutputs({
    assetValue,
    recipient,
    memo,
    sender,
    fetchTxHex = false,
  }: {
    assetValue: AssetValue;
    recipient: string;
    memo?: string;
    sender: string;
    fetchTxHex?: boolean;
  }) {
    const inputs = await getUtxoApi(chain).scanUTXOs({ address: sender, fetchTxHex });

    //1. add output amount and recipient to targets
    //2. add output memo to targets (optional)

    return {
      inputs,
      outputs: [
        { address: recipient, value: Number(assetValue.bigIntValue) },
        ...(memo ? [{ address: "", script: await compileMemo(memo), value: 0 }] : []),
      ],
    };
  };
}
