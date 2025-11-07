import {
  address as bchAddress,
  Transaction,
  TransactionBuilder,
  // @ts-expect-error
} from "@psf/bitcoincashjs-lib";
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
import { Psbt } from "bitcoinjs-lib";
import { accumulative, compileMemo, getUtxoApi, getUtxoNetwork, toCashAddress, toLegacyAddress } from "../helpers";
import type {
  BchECPair,
  TargetOutput,
  TransactionBuilderType,
  TransactionType,
  UTXOBuildTxParams,
  UTXOTransferParams,
  UTXOType,
} from "../types";
import type { UtxoToolboxParams } from "./params";
import { createUTXOToolbox, getCreateKeysForPath } from "./utxo";
import { bchValidateAddress, stripPrefix } from "./validators";

const chain = Chain.BitcoinCash;

export function stripToCashAddress(address: string) {
  return stripPrefix(toCashAddress(address));
}

function createSignerWithKeys(keys: BchECPair) {
  function signTransaction({ builder, utxos }: { builder: TransactionBuilderType; utxos: UTXOType[] }) {
    utxos.forEach((utxo, index) => {
      builder.sign(index, keys, undefined, 0x41, utxo.witnessUtxo?.value);
    });

    return builder.build();
  }

  const getAddress = () => {
    const address = keys.getAddress(0);
    return Promise.resolve(stripToCashAddress(address));
  };

  return { getAddress, signTransaction };
}

export async function createBCHToolbox<T extends typeof Chain.BitcoinCash>(
  toolboxParams: UtxoToolboxParams[T] | { phrase?: string; derivationPath?: DerivationPathArray; index?: number },
) {
  const phrase = "phrase" in toolboxParams ? toolboxParams.phrase : undefined;

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;

  const derivationPath = derivationPathToString(
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index }),
  );

  const keys = phrase ? (await getCreateKeysForPath(chain))({ derivationPath, phrase }) : undefined;

  const signer = keys ? createSignerWithKeys(keys) : "signer" in toolboxParams ? toolboxParams.signer : undefined;

  function getAddress() {
    return Promise.resolve(signer?.getAddress());
  }

  const { getBalance, getFeeRates, broadcastTx, ...toolbox } = await createUTXOToolbox({ chain });

  function handleGetBalance(address: string, _scamFilter = true) {
    return getBalance(stripPrefix(toCashAddress(address)));
  }

  return {
    ...toolbox,
    broadcastTx,
    buildTx,
    createTransaction,
    getAddress,
    getAddressFromKeys,
    getBalance: handleGetBalance,
    getFeeRates,
    stripPrefix,
    stripToCashAddress,
    transfer: transfer({ broadcastTx, getFeeRates, signer }),
    validateAddress: bchValidateAddress,
  };
}

async function createTransaction({ assetValue, recipient, memo, feeRate, sender }: UTXOBuildTxParams) {
  if (!bchValidateAddress(recipient)) throw new SwapKitError("toolbox_utxo_invalid_address", { address: recipient });

  // Overestimate by 7500 byte * feeRate to ensure we have enough UTXOs for fees and change
  const targetValue = Math.ceil(assetValue.getBaseValue("number") + feeRate * 7500);

  const utxos = await getUtxoApi(chain).getUtxos({
    address: stripToCashAddress(sender),
    fetchTxHex: true,
    targetValue,
  });

  const compiledMemo = memo ? await compileMemo(memo) : null;

  const targetOutputs: TargetOutput[] = [];
  // output to recipient
  targetOutputs.push({ address: recipient, value: assetValue.getBaseValue("number") });
  const { inputs, outputs } = accumulative({ chain, feeRate, inputs: utxos, outputs: targetOutputs });

  // .inputs and .outputs will be undefined if no solution was found
  if (!(inputs && outputs)) throw new SwapKitError("toolbox_utxo_insufficient_balance", { assetValue, sender });
  const getNetwork = await getUtxoNetwork();
  const builder = new TransactionBuilder(getNetwork(chain)) as TransactionBuilderType;

  await Promise.all(
    inputs.map(async (utxo: UTXOType) => {
      const txHex = await getUtxoApi(chain).getRawTx(utxo.hash);

      builder.addInput(Transaction.fromBuffer(Buffer.from(txHex, "hex")), utxo.index);
    }),
  );

  for (const output of outputs) {
    const address = "address" in output && output.address ? output.address : toLegacyAddress(sender);
    const getNetwork = await getUtxoNetwork();
    const outputScript = bchAddress.toOutputScript(toLegacyAddress(address), getNetwork(chain));

    builder.addOutput(outputScript, output.value);
  }

  // add output for memo
  if (compiledMemo) {
    builder.addOutput(compiledMemo, 0); // Add OP_RETURN {script, value}
  }

  return { builder, utxos: inputs };
}

function transfer({
  broadcastTx,
  getFeeRates,
  signer,
}: {
  broadcastTx: (txHash: string) => Promise<string>;
  getFeeRates: () => Promise<Record<FeeOption, number>>;
  signer?: ChainSigner<{ builder: TransactionBuilderType; utxos: UTXOType[] }, TransactionType>;
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
    const { builder, utxos } = await createTransaction({ ...rest, assetValue, feeRate, recipient, sender: from });

    const tx = await signer.signTransaction({ builder, utxos });
    const txHex = tx.toHex();

    return broadcastTx(txHex);
  };
}

async function buildTx({
  assetValue,
  recipient,
  memo,
  feeRate,
  sender,
  setSigHashType,
}: UTXOBuildTxParams & { setSigHashType?: boolean }) {
  const recipientCashAddress = toCashAddress(recipient);
  if (!bchValidateAddress(recipientCashAddress))
    throw new SwapKitError("toolbox_utxo_invalid_address", { address: recipientCashAddress });

  // Overestimate by 7500 byte * feeRate to ensure we have enough UTXOs for fees and change
  const targetValue = Math.ceil(assetValue.getBaseValue("number") + feeRate * 7500);

  const utxos = await getUtxoApi(chain).getUtxos({
    address: stripToCashAddress(sender),
    fetchTxHex: false,
    targetValue,
  });

  const feeRateWhole = Number(feeRate.toFixed(0));
  const compiledMemo = memo ? await compileMemo(memo) : null;

  const targetOutputs = [] as TargetOutput[];

  // output to recipient
  targetOutputs.push({ address: toLegacyAddress(recipient), value: assetValue.getBaseValue("number") });

  //2. add output memo to targets (optional)
  if (compiledMemo) {
    targetOutputs.push({ script: compiledMemo, value: 0 });
  }

  const { inputs, outputs } = accumulative({ chain, feeRate: feeRateWhole, inputs: utxos, outputs: targetOutputs });

  // .inputs and .outputs will be undefined if no solution was found
  if (!(inputs && outputs)) throw new SwapKitError("toolbox_utxo_insufficient_balance", { assetValue, sender });
  const getNetwork = await getUtxoNetwork();
  const psbt = new Psbt({ network: getNetwork(chain) }); // Network-specific

  for (const { hash, index, witnessUtxo } of inputs) {
    psbt.addInput({ hash, index, sighashType: setSigHashType ? 0x41 : undefined, witnessUtxo });
  }

  // Outputs
  for (const output of outputs) {
    const address = "address" in output && output.address ? output.address : toLegacyAddress(sender);
    const params = output.script
      ? compiledMemo
        ? { script: compiledMemo, value: 0 }
        : undefined
      : { address, value: output.value };

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
