import {
  Chain,
  type ChainSigner,
  type DerivationPathArray,
  FeeOption,
  NetworkDerivationPath,
  type TransferParams,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import type { UtxoToolboxParams } from ".";
import {
  accumulative,
  Network as bchNetwork,
  compileMemo,
  detectAddressNetwork,
  getUtxoApi,
  getUtxoNetwork,
  isValidAddress,
  toCashAddress,
  toLegacyAddress,
} from "../helpers";
import type {
  BchECPair,
  TargetOutput,
  TransactionBuilderType,
  TransactionType,
  UTXOBuildTxParams,
  UTXOType,
} from "../types";
import { createUTXOToolbox, getCreateKeysForPath } from "./utxo";

const chain = Chain.BitcoinCash;

export function stripPrefix(address: string) {
  return address.replace(/(bchtest:|bitcoincash:)/, "");
}

export function validateAddress(address: string) {
  const strippedAddress = stripPrefix(address);
  return (
    isValidAddress(strippedAddress) && detectAddressNetwork(strippedAddress) === bchNetwork.Mainnet
  );
}

export function stripToCashAddress(address: string) {
  return stripPrefix(toCashAddress(address));
}

async function createSignerWithKeys(keys: BchECPair) {
  async function signTransaction({
    builder,
    utxos,
  }: { builder: TransactionBuilderType; utxos: UTXOType[] }) {
    utxos.forEach((utxo, index) => {
      builder.sign(index, keys, undefined, 0x41, utxo.witnessUtxo?.value);
    });

    return builder.build();
  }

  const getAddress = () => {
    const address = keys.getAddress(0);
    return Promise.resolve(stripToCashAddress(address));
  };

  return {
    getAddress,
    signTransaction,
  };
}

export async function createBCHToolbox<T extends Chain.BitcoinCash>(
  toolboxParams:
    | UtxoToolboxParams[T]
    | {
        phrase?: string;
        derivationPath?: DerivationPathArray;
        index?: number;
      },
) {
  const phrase = "phrase" in toolboxParams ? toolboxParams.phrase : undefined;

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;

  const derivationPath = derivationPathToString(
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index }),
  );

  const keys = (await getCreateKeysForPath(chain))({ phrase, derivationPath });

  const signer = keys
    ? await createSignerWithKeys(keys)
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

  return {
    ...toolbox,
    getAddress,
    broadcastTx,
    buildBCHTx,
    buildTx,
    getAddressFromKeys,
    getBalance: handleGetBalance,
    getFeeRates,
    stripPrefix,
    stripToCashAddress,
    validateAddress,
    transfer: transfer({ getFeeRates, broadcastTx, signer }),
  };
}

async function buildBCHTx({ assetValue, recipient, memo, feeRate, sender }: UTXOBuildTxParams) {
  const {
    Transaction,
    TransactionBuilder,
    address: bchAddress,
    // @ts-ignore
  } = await import("@psf/bitcoincashjs-lib");
  if (!validateAddress(recipient)) throw new Error("Invalid address");
  const utxos = await getUtxoApi(chain).scanUTXOs({
    address: stripToCashAddress(sender),
    fetchTxHex: true,
  });

  const compiledMemo = memo ? await compileMemo(memo) : null;

  const targetOutputs: TargetOutput[] = [];
  // output to recipient
  targetOutputs.push({
    address: recipient,
    value: assetValue.getBaseValue("number"),
  });
  const { inputs, outputs } = accumulative({
    inputs: utxos,
    outputs: targetOutputs,
    feeRate,
    chain,
  });

  // .inputs and .outputs will be undefined if no solution was found
  if (!(inputs && outputs)) throw new Error("Balance insufficient for transaction");
  const getNetwork = await getUtxoNetwork();
  const builder = new TransactionBuilder(getNetwork(chain));

  await Promise.all(
    inputs.map(async (utxo: UTXOType) => {
      const txHex = await getUtxoApi(chain).getRawTx(utxo.hash);

      builder.addInput(Transaction.fromBuffer(Buffer.from(txHex, "hex")), utxo.index);
    }),
  );

  for (const output of outputs) {
    const address =
      "address" in output && output.address ? output.address : toLegacyAddress(sender);
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
  return async function transfer({ recipient, assetValue, feeOptionKey, ...rest }: TransferParams) {
    const from = await signer?.getAddress();
    if (!(signer && from)) throw new Error("Signer must provider address");
    if (!recipient) throw new Error("Recipient address must be provided");

    const feeRate = rest.feeRate || (await getFeeRates())[feeOptionKey || FeeOption.Fast];

    // try out if psbt tx is faster/better/nicer
    const { builder, utxos } = await buildBCHTx({
      ...rest,
      assetValue,
      feeRate,
      recipient,
      sender: from,
    });

    const tx = await signer.signTransaction({ builder, utxos });
    const txHex = tx.toHex();

    return broadcastTx(txHex);
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: refactor
async function buildTx({ assetValue, recipient, memo, feeRate, sender }: UTXOBuildTxParams) {
  const { Psbt } = await import("bitcoinjs-lib");
  const recipientCashAddress = toCashAddress(recipient);
  if (!validateAddress(recipientCashAddress)) throw new Error("Invalid address");

  const utxos = await getUtxoApi(chain).scanUTXOs({
    address: stripToCashAddress(sender),
    fetchTxHex: true,
  });

  const feeRateWhole = Number(feeRate.toFixed(0));
  const compiledMemo = memo ? await compileMemo(memo) : null;

  const targetOutputs = [] as TargetOutput[];

  // output to recipient
  targetOutputs.push({
    address: toLegacyAddress(recipient),
    value: assetValue.getBaseValue("number"),
  });

  //2. add output memo to targets (optional)
  if (compiledMemo) {
    targetOutputs.push({ script: compiledMemo, value: 0 });
  }

  const { inputs, outputs } = accumulative({
    inputs: utxos,
    outputs: targetOutputs,
    feeRate: feeRateWhole,
    chain,
  });

  // .inputs and .outputs will be undefined if no solution was found
  if (!(inputs && outputs)) throw new Error("Balance insufficient for transaction");
  const getNetwork = await getUtxoNetwork();
  const psbt = new Psbt({ network: getNetwork(chain) }); // Network-specific

  for (const { hash, index, witnessUtxo } of inputs) {
    psbt.addInput({ hash, index, witnessUtxo });
  }

  // Outputs
  for (const output of outputs) {
    const address =
      "address" in output && output.address ? output.address : toLegacyAddress(sender);
    const params = output.script
      ? compiledMemo
        ? { script: compiledMemo, value: 0 }
        : undefined
      : { address, value: output.value };

    if (params) {
      psbt.addOutput(params);
    }
  }

  return { psbt, utxos, inputs: inputs as UTXOType[] };
}

function getAddressFromKeys(keys: { getAddress: (index?: number) => string }) {
  const address = keys.getAddress(0);
  return stripToCashAddress(address);
}
