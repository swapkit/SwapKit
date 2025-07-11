import {
  AssetValue,
  Chain,
  type ChainSigner,
  DerivationPath,
  type DerivationPathArray,
  FeeOption,
  NetworkDerivationPath,
  SwapKitError,
  SwapKitNumber,
  type UTXOChain,
  applyFeeMultiplier,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import { Psbt, address as btcLibAddress, initEccLib, payments } from "bitcoinjs-lib";
import type { ECPairInterface } from "ecpair";
import { ECPairFactory } from "ecpair";
import type { UtxoToolboxParams } from ".";
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
import type {
  BchECPair,
  TargetOutput,
  UTXOBuildTxParams,
  UTXOTransferParams,
  UTXOType,
} from "../types";
import { bchValidateAddress } from "./bitcoinCash";

import secp256k1 from "@bitcoinerlab/secp256k1";
// @ts-ignore
import { ECPair, HDNode } from "@psf/bitcoincashjs-lib";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import { validateZcashAddress } from "./zcash";

export const nonSegwitChains = [Chain.Dash, Chain.Dogecoin];

function addInputsAndOutputs({
  inputs,
  outputs,
  chain,
  psbt,
  sender,
  compiledMemo,
}: {
  inputs: UTXOType[];
  outputs: TargetOutput[];
  chain: UTXOChain;
  psbt: Psbt;
  sender: string;
  compiledMemo: Buffer<ArrayBufferLike> | null;
}) {
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
    const hasOutputScript = output.script;

    if (hasOutputScript && !compiledMemo) {
      continue;
    }

    const mappedOutput = hasOutputScript
      ? {
          script: compiledMemo as Buffer<ArrayBufferLike>,
          value: 0,
        }
      : {
          address,
          value: output.value,
        };

    initEccLib(secp256k1);
    psbt.addOutput(mappedOutput);
  }

  return { psbt, inputs };
}

async function createTransaction({
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
  const chain = assetValue.chain as UTXOChain;
  const compiledMemo = memo ? await compileMemo(memo) : null;

  const inputsAndOutputs = await getInputsAndTargetOutputs({
    assetValue,
    recipient,
    memo,
    sender,
    fetchTxHex,
  });

  const { inputs, outputs } = accumulative({ ...inputsAndOutputs, feeRate, chain });

  // .inputs and .outputs will be undefined if no solution was found
  if (!(inputs && outputs))
    throw new SwapKitError("toolbox_utxo_insufficient_balance", { sender, assetValue });
  const getNetwork = await getUtxoNetwork();
  const psbt = new Psbt({ network: getNetwork(chain) });

  if (chain === Chain.Dogecoin) psbt.setMaximumFeeRate(650000000);

  const { psbt: mappedPsbt, inputs: mappedInputs } = await addInputsAndOutputs({
    inputs,
    outputs,
    chain,
    psbt,
    sender,
    compiledMemo,
  });

  return {
    psbt: mappedPsbt,
    utxos: inputsAndOutputs.inputs,
    inputs: mappedInputs,
  };
}

export async function getUTXOAddressValidator() {
  const getNetwork = await getUtxoNetwork();

  return function validateAddress({ address, chain }: { address: string; chain: UTXOChain }) {
    if (chain === Chain.BitcoinCash) {
      return bchValidateAddress(address);
    }

    if (chain === Chain.Zcash) {
      return validateZcashAddress(address);
    }

    try {
      initEccLib(secp256k1);
      btcLibAddress.toOutputScript(address, getNetwork(chain));
      return true;
    } catch (_error) {
      return false;
    }
  };
}

async function createSignerWithKeys({
  chain,
  phrase,
  derivationPath,
}: { chain: UTXOChain; phrase: string; derivationPath: string }) {
  const keyPair = (await getCreateKeysForPath(chain as Chain.Bitcoin))({ phrase, derivationPath });

  async function signTransaction(psbt: Psbt) {
    await psbt.signAllInputs(keyPair);
    return psbt;
  }

  async function getAddress() {
    const addressGetter = await addressFromKeysGetter(chain);
    return addressGetter(keyPair);
  }

  return {
    getAddress,
    signTransaction,
  };
}

export async function createUTXOToolbox<T extends UTXOChain>({
  chain,
  ...toolboxParams
}: (
  | UtxoToolboxParams[T]
  | {
      phrase?: string;
      derivationPath?: DerivationPathArray;
      index?: number;
    }
) & { chain: T }) {
  const phrase = "phrase" in toolboxParams ? toolboxParams.phrase : undefined;

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;

  const derivationPath = derivationPathToString(
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index }),
  );

  const signer = phrase
    ? await createSignerWithKeys({ chain, phrase, derivationPath })
    : "signer" in toolboxParams
      ? toolboxParams.signer
      : undefined;

  function getAddress() {
    return Promise.resolve(signer?.getAddress());
  }

  //   const { signer } = params || {};
  const getAddressFromKeys = await addressFromKeysGetter(chain);
  const validateAddress = await getUTXOAddressValidator();
  const createKeysForPath = await getCreateKeysForPath(chain);

  return {
    accumulative,
    calculateTxSize,
    getAddressFromKeys,
    getAddress,
    validateAddress: (address: string) => validateAddress({ address, chain }),
    broadcastTx: (txHash: string) => getUtxoApi(chain).broadcastTx(txHash),
    createTransaction,
    createKeysForPath,
    getFeeRates: () => getFeeRates(chain),
    getInputsOutputsFee,
    transfer: transfer(signer as UtxoToolboxParams["BTC"]["signer"]),
    getPrivateKeyFromMnemonic: (params: { phrase: string; derivationPath: string }) => {
      const keys = createKeysForPath(params);
      return keys.toWIF();
    },

    getBalance: getBalance(chain),
    estimateTransactionFee: estimateTransactionFee(chain),
    estimateMaxSendableAmount: estimateMaxSendableAmount(chain),
  };
}

async function getInputsOutputsFee({
  assetValue,
  feeOptionKey = FeeOption.Fast,
  feeRate,
  memo,
  sender,
  recipient,
}: Omit<UTXOBuildTxParams, "feeRate"> & {
  feeOptionKey?: FeeOption;
  feeRate?: number;
}) {
  const chain = assetValue.chain as UTXOChain;

  const inputsAndOutputs = await getInputsAndTargetOutputs({
    assetValue,
    sender,
    memo,
    recipient,
  });

  const feeRateWhole = feeRate ? Math.floor(feeRate) : (await getFeeRates(chain))[feeOptionKey];

  return accumulative({ ...inputsAndOutputs, feeRate: feeRateWhole, chain });
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
    sender: string;
    memo?: string;
    feeOptionKey?: FeeOption;
    feeRate?: number;
    fetchTxHex?: boolean;
  }) => {
    const inputFees = await getInputsOutputsFee(params);

    return AssetValue.from({
      chain,
      value: SwapKitNumber.fromBigInt(BigInt(inputFees.fee), 8).getValue("string"),
    });
  };
}

type CreateKeysForPathReturnType = {
  [Chain.BitcoinCash]: BchECPair;
  [Chain.Bitcoin]: ECPairInterface;
  [Chain.Dash]: ECPairInterface;
  [Chain.Dogecoin]: ECPairInterface;
  [Chain.Litecoin]: ECPairInterface;
  [Chain.Zcash]: ECPairInterface;
};

export async function getCreateKeysForPath<T extends keyof CreateKeysForPathReturnType>(
  chain: T,
): Promise<
  (params: {
    wif?: string;
    phrase?: string;
    derivationPath?: string;
  }) => CreateKeysForPathReturnType[T]
> {
  const getNetwork = await getUtxoNetwork();

  switch (chain) {
    case Chain.BitcoinCash: {
      return function createKeysForPath({
        phrase,
        derivationPath = `${DerivationPath.BCH}/0`,
        wif,
      }: { wif?: string; phrase?: string; derivationPath?: string }) {
        const network = getNetwork(chain);

        if (wif) {
          return ECPair.fromWIF(wif, network) as BchECPair;
        }
        if (!phrase)
          throw new SwapKitError("toolbox_utxo_invalid_params", { error: "No phrase provided" });

        const masterHDNode = HDNode.fromSeedBuffer(
          Buffer.from(mnemonicToSeedSync(phrase)),
          network,
        );
        const keyPair = masterHDNode.derivePath(derivationPath).keyPair;

        return keyPair as BchECPair;
      } as (params: {
        wif?: string;
        phrase?: string;
        derivationPath?: string;
      }) => CreateKeysForPathReturnType[T];
    }
    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.Litecoin:
    case Chain.Zcash:
    case Chain.Dash: {
      return function createKeysForPath({
        phrase,
        wif,
        derivationPath,
      }: { phrase?: string; wif?: string; derivationPath: string }) {
        if (!(wif || phrase))
          throw new SwapKitError("toolbox_utxo_invalid_params", {
            error: "Either phrase or wif must be provided",
          });

        const factory = ECPairFactory(secp256k1);
        const network = getNetwork(chain);

        if (wif) return factory.fromWIF(wif, network);

        const seed = mnemonicToSeedSync(phrase as string);
        const master = HDKey.fromMasterSeed(seed, network).derive(derivationPath);
        if (!master.privateKey)
          throw new SwapKitError("toolbox_utxo_invalid_params", {
            error: "Could not get private key from phrase",
          });

        return factory.fromPrivateKey(Buffer.from(master.privateKey), { network });
      } as (params: {
        wif?: string;
        phrase?: string;
        derivationPath?: string;
      }) => CreateKeysForPathReturnType[T];
    }
    default:
      throw new SwapKitError("toolbox_utxo_not_supported", { chain });
  }
}

export async function addressFromKeysGetter(chain: UTXOChain) {
  const getNetwork = await getUtxoNetwork();

  return function getAddressFromKeys(keys: ECPairInterface | BchECPair) {
    if (!keys)
      throw new SwapKitError("toolbox_utxo_invalid_params", { error: "Keys must be provided" });

    const method = nonSegwitChains.includes(chain) ? payments.p2pkh : payments.p2wpkh;
    const { address } = method({ pubkey: keys.publicKey as Buffer, network: getNetwork(chain) });
    if (!address)
      throw new SwapKitError("toolbox_utxo_invalid_address", { error: "Address not defined" });

    return address;
  };
}

function transfer(signer?: ChainSigner<Psbt, Psbt>) {
  return async function transfer({
    memo,
    recipient,
    feeOptionKey,
    feeRate,
    assetValue,
  }: UTXOTransferParams) {
    const from = await signer?.getAddress();

    const chain = assetValue.chain as UTXOChain;

    if (!(signer && from)) throw new SwapKitError("toolbox_utxo_no_signer");
    if (!recipient)
      throw new SwapKitError("toolbox_utxo_invalid_params", {
        error: "Recipient address must be provided",
      });
    const txFeeRate = feeRate || (await getFeeRates(chain))[feeOptionKey || FeeOption.Fast];

    const { psbt } = await createTransaction({
      recipient,
      feeRate: txFeeRate,
      sender: from,
      assetValue,
      memo,
    });
    const signedPsbt = await signer.signTransaction(psbt);
    signedPsbt.finalizeAllInputs(); // Finalise inputs
    // TX extracted and formatted to hex
    return getUtxoApi(chain).broadcastTx(signedPsbt.extractTransaction().toHex());
  };
}

async function getFeeRates(chain: UTXOChain) {
  const suggestedFeeRate = await getUtxoApi(chain).getSuggestedTxFee();

  return {
    [FeeOption.Average]: suggestedFeeRate,
    [FeeOption.Fast]: applyFeeMultiplier(suggestedFeeRate, FeeOption.Fast),
    [FeeOption.Fastest]: applyFeeMultiplier(suggestedFeeRate, FeeOption.Fastest),
  };
}

async function getInputsAndTargetOutputs({
  assetValue,
  recipient,
  memo,
  sender,
  fetchTxHex: fetchTxOverwrite = false,
}: Omit<UTXOBuildTxParams, "feeRate">) {
  const chain = assetValue.chain as UTXOChain;
  const feeRate = (await getFeeRates(chain))[FeeOption.Fastest];

  const fetchTxHex = fetchTxOverwrite || nonSegwitChains.includes(chain);

  const amountToSend = assetValue.getBaseValue("number");

  // Overestimate by 5000 byte * highest feeRate to ensure we have enough UTXOs for fees and change
  const targetValue = Math.ceil(amountToSend + feeRate * 5000);

  const inputs = await getUtxoApi(chain).getUtxos({ address: sender, fetchTxHex, targetValue });

  return {
    inputs,
    outputs: [
      { address: recipient, value: amountToSend },
      ...(memo ? [{ address: "", script: await compileMemo(memo), value: 0 }] : []),
    ],
  };
}
