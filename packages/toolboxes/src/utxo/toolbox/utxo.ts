// TODO: remove this
import * as secp256k1 from "@bitcoinerlab/secp256k1";
import {
  AssetValue,
  BaseDecimal,
  Chain,
  FeeOption,
  SwapKitNumber,
  type UTXOChain,
} from "@swapkit/helpers";
import { Psbt, address as btcLibAddress, initEccLib, payments } from "bitcoinjs-lib";
import type { ECPairInterface } from "ecpair";

import {
  UTXOScriptType,
  accumulative,
  calculateTxSize,
  compileMemo,
  getDustThreshold,
  getInputSize,
  getNetwork,
  getUtxoApi,
  standardFeeRates,
} from "../helpers";
import type { TargetOutput, UTXOBuildTxParams, UTXOType, UTXOWalletTransferParams } from "../types";
import { validateAddress as validateBCHAddress } from "./bitcoinCash";
import type { BCHToolbox, BTCToolbox, DASHToolbox, DOGEToolbox, LTCToolbox } from "./index";

export const nonSegwitChains = [Chain.Dash, Chain.Dogecoin];

function createKeysForPath(chain: Chain) {
  return async function createKeysForPath({
    phrase,
    wif,
    derivationPath,
  }: { phrase?: string; wif?: string; derivationPath: string }) {
    const { ECPairFactory } = await import("ecpair");
    const secp256k1 = await import("@bitcoinerlab/secp256k1");
    const { HDKey } = await import("@scure/bip32");
    const { mnemonicToSeedSync } = await import("@scure/bip39");

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

function validateAddress(chain: UTXOChain) {
  return function validateAddress(address: string) {
    try {
      initEccLib(secp256k1);
      btcLibAddress.toOutputScript(address, getNetwork(chain));
      return true;
    } catch (_error) {
      return false;
    }
  };
}

function getAddressFromKeys(chain: UTXOChain) {
  return function getAddressFromKeys(keys: ECPairInterface) {
    if (!keys) throw new Error("Keys must be provided");

    const method = nonSegwitChains.includes(chain) ? payments.p2pkh : payments.p2wpkh;
    const { address } = method({ pubkey: keys.publicKey, network: getNetwork(chain) });
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
    broadcastTx,
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
    return broadcastTx(signedPsbt.extractTransaction().toHex());
  };
}

function getBalance(chain: UTXOChain) {
  return async function getBalance(address: string, _scamFilter = true) {
    const baseBalance = await getUtxoApi(chain).getBalance(address);
    const balance = SwapKitNumber.fromBigInt(BigInt(baseBalance), BaseDecimal[chain]).getValue(
      "string",
    );
    const asset = AssetValue.from({ asset: `${chain}.${chain}`, value: balance });

    return [asset];
  };
}

async function getFeeRates(chain: UTXOChain) {
  const suggestedFeeRate = await getUtxoApi(chain).getSuggestedTxFee();

  return standardFeeRates(suggestedFeeRate);
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
        ...(memo ? [{ address: "", script: compileMemo(memo), value: 0 }] : []),
      ],
    };
  };
}

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
    const compiledMemo = memo ? compileMemo(memo) : null;
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
    const psbt = new Psbt({ network: getNetwork(chain) });

    if (chain === Chain.Dogecoin) psbt.setMaximumFeeRate(650000000);

    for (const utxo of inputs) {
      psbt.addInput({
        hash: utxo.hash,
        index: utxo.index,
        ...(!!utxo.witnessUtxo &&
          !nonSegwitChains.includes(chain) && { witnessUtxo: utxo.witnessUtxo }),
        ...(nonSegwitChains.includes(chain) && {
          nonWitnessUtxo: utxo.txHex ? Buffer.from(utxo.txHex, "hex") : undefined,
        }),
      });
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
      const compiledMemo = compileMemo(memo);
      outputs.push({ address: from, script: compiledMemo, value: 0 });
    }

    const txSize = calculateTxSize({ inputs, outputs, feeRate: feeRateWhole });

    const fee = txSize * feeRateWhole;

    return balance.sub(fee);
  };
}

export function BaseUTXOToolbox(chain: UTXOChain) {
  return function createUTXOToolbox() {
    return {
      accumulative,
      calculateTxSize,
      getFeeRates: () => getFeeRates(chain),
      buildTx: buildTx(chain),
      transfer: transfer(chain),
      getInputsOutputsFee: getInputsOutputsFee(chain),

      broadcastTx: (txHash: string) => getUtxoApi(chain).broadcastTx(txHash),
      getAddressFromKeys: getAddressFromKeys(chain),
      validateAddress: validateAddress(chain),
      createKeysForPath: createKeysForPath(chain),

      getPrivateKeyFromMnemonic: async (params: { phrase: string; derivationPath: string }) => {
        const getKeysForPath = createKeysForPath(chain);
        const keys = await getKeysForPath(params);
        return keys.toWIF();
      },

      getBalance: getBalance(chain),

      estimateTransactionFee: async (params: {
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
      },

      estimateMaxSendableAmount: async (params: any) =>
        estimateMaxSendableAmount({ ...params, chain }),
    };
  };
}

export function utxoValidateAddress({ chain, address }: { chain: UTXOChain; address: string }) {
  return chain === Chain.BitcoinCash
    ? validateBCHAddress(address)
    : validateAddress(chain)(address);
}

export type BaseUTXOWallet = ReturnType<ReturnType<typeof BaseUTXOToolbox>>;
type UTXOWalletType = {
  [Chain.Bitcoin]: ReturnType<typeof BTCToolbox>;
  [Chain.BitcoinCash]: ReturnType<typeof BCHToolbox>;
  [Chain.Dogecoin]: ReturnType<typeof DOGEToolbox>;
  [Chain.Litecoin]: ReturnType<typeof LTCToolbox>;
  [Chain.Dash]: ReturnType<typeof DASHToolbox>;
};
export type UTXOWallets = { [chain in UTXOChain]: BaseUTXOWallet & UTXOWalletType[chain] };
