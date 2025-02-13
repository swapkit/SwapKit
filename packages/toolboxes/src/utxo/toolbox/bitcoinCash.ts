import * as secp256k1 from "@bitcoinerlab/secp256k1";
import {
  HDNode,
  Transaction,
  TransactionBuilder,
  address as bchAddress,
  // @ts-ignore TODO: check why wallets doesn't see modules included in toolbox
} from "@psf/bitcoincashjs-lib";
import { mnemonicToSeedSync } from "@scure/bip39";
import { Chain, DerivationPath, FeeOption, type UTXOChain } from "@swapkit/helpers";
import { Psbt } from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";

import {
  accumulative,
  Network as bchNetwork,
  compileMemo,
  detectAddressNetwork,
  getNetwork,
  getUtxoApi,
  isValidAddress,
  toCashAddress,
  toLegacyAddress,
} from "../helpers";
import type {
  TargetOutput,
  TransactionBuilderType,
  TransactionType,
  UTXOBuildTxParams,
  UTXOType,
  UTXOWalletTransferParams,
} from "../types";

import { BaseUTXOToolbox } from "./utxo";

// needed because TS can not infer types
type BCHMethods = {
  stripPrefix: (address: string) => string;
  stripToCashAddress: (address: string) => string;
  validateAddress: (address: string, chain?: UTXOChain) => boolean;
  createKeysForPath: (params: {
    wif?: string;
    phrase?: string;
    derivationPath?: string;
  }) => Promise<{ getAddress: (index?: number) => string }>;
  getAddressFromKeys: (keys: { getAddress: (index?: number) => string }) => string;
  buildBCHTx: (
    params: UTXOBuildTxParams,
  ) => Promise<{ builder: TransactionBuilderType; utxos: UTXOType[] }>;
  buildTx: (params: UTXOBuildTxParams) => Promise<{ psbt: Psbt }>;
  transfer: (
    params: UTXOWalletTransferParams<
      { builder: TransactionBuilderType; utxos: UTXOType[] },
      TransactionType
    >,
  ) => Promise<string>;
};

const chain = Chain.BitcoinCash as UTXOChain;

export const stripToCashAddress = (address: string) => stripPrefix(toCashAddress(address));

const buildBCHTx: BCHMethods["buildBCHTx"] = async ({
  assetValue,
  recipient,
  memo,
  feeRate,
  sender,
}) => {
  if (!validateAddress(recipient)) throw new Error("Invalid address");
  const utxos = await getUtxoApi(chain).scanUTXOs({
    address: stripToCashAddress(sender),
    fetchTxHex: true,
  });

  const compiledMemo = memo ? compileMemo(memo) : null;

  const targetOutputs: TargetOutput[] = [];
  // output to recipient
  targetOutputs.push({ address: recipient, value: assetValue.getBaseValue("number") });
  const { inputs, outputs } = accumulative({
    inputs: utxos,
    outputs: targetOutputs,
    feeRate,
    chain,
  });

  // .inputs and .outputs will be undefined if no solution was found
  if (!(inputs && outputs)) throw new Error("Balance insufficient for transaction");

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
    const outputScript = bchAddress.toOutputScript(toLegacyAddress(address), getNetwork(chain));

    builder.addOutput(outputScript, output.value);
  }

  // add output for memo
  if (compiledMemo) {
    builder.addOutput(compiledMemo, 0); // Add OP_RETURN {script, value}
  }

  return { builder, utxos: inputs };
};

const transfer = async ({
  signTransaction,
  from,
  recipient,
  assetValue,
  broadcastTx,
  getFeeRates,
  ...rest
}: UTXOWalletTransferParams<
  { builder: TransactionBuilderType; utxos: UTXOType[] },
  TransactionType
> & {
  broadcastTx: (txHash: string) => Promise<string>;
  getFeeRates: () => Promise<Record<FeeOption, number>>;
}) => {
  if (!from) throw new Error("From address must be provided");
  if (!recipient) throw new Error("Recipient address must be provided");
  if (!signTransaction) throw new Error("signTransaction must be provided");

  const feeRate = rest.feeRate || (await getFeeRates())[FeeOption.Fast];

  // try out if psbt tx is faster/better/nicer
  const { builder, utxos } = await buildBCHTx({
    ...rest,
    assetValue,
    feeRate,
    recipient,
    sender: from,
  });

  const tx = await signTransaction({ builder, utxos });
  const txHex = tx.toHex();

  return broadcastTx(txHex);
};

const buildTx = async ({
  assetValue,
  recipient,
  memo,
  feeRate,
  sender,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: refactor
}: UTXOBuildTxParams) => {
  const recipientCashAddress = toCashAddress(recipient);
  if (!validateAddress(recipientCashAddress)) throw new Error("Invalid address");

  const utxos = await getUtxoApi(chain).scanUTXOs({
    address: stripToCashAddress(sender),
    fetchTxHex: true,
  });

  const feeRateWhole = Number(feeRate.toFixed(0));
  const compiledMemo = memo ? compileMemo(memo) : null;

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
};

export const stripPrefix = (address: string) => address.replace(/(bchtest:|bitcoincash:)/, "");

export const validateAddress = (address: string) => {
  const strippedAddress = stripPrefix(address);
  return (
    isValidAddress(strippedAddress) && detectAddressNetwork(strippedAddress) === bchNetwork.Mainnet
  );
};

const createKeysForPath: BCHMethods["createKeysForPath"] = ({
  phrase,
  derivationPath = `${DerivationPath.BCH}/0`,
  wif,
}) => {
  const network = getNetwork(chain);

  if (wif) {
    return ECPairFactory(secp256k1).fromWIF(wif, network);
  }
  if (!phrase) throw new Error("No phrase provided");

  const masterHDNode = HDNode.fromSeedBuffer(Buffer.from(mnemonicToSeedSync(phrase)), network);
  const keyPair = masterHDNode.derivePath(derivationPath).keyPair;
  // TODO: Figure out same pattern as in BTC
  // const testWif = keyPair.toWIF();
  // const k = ECPairFactory(secp256k1).fromWIF(testWif, network);
  // const a = payments.p2pkh({ pubkey: k.publicKey, network });

  return keyPair;
};

const getAddressFromKeys = (keys: { getAddress: (index?: number) => string }) => {
  const address = keys.getAddress(0);
  return stripToCashAddress(address);
};

export const createBCHToolbox = (): Omit<
  ReturnType<typeof BaseUTXOToolbox>,
  "getAddressFromKeys" | "transfer" | "createKeysForPath"
> &
  BCHMethods => {
  const { getBalance, ...toolbox } = BaseUTXOToolbox(Chain.BitcoinCash);

  return {
    ...toolbox,
    stripPrefix,
    stripToCashAddress,
    validateAddress,
    createKeysForPath,
    getAddressFromKeys,
    buildBCHTx,
    buildTx,
    getBalance: (address: string, _potentialScamFilter?: boolean) =>
      getBalance(stripPrefix(toCashAddress(address))),
    transfer: (
      params: UTXOWalletTransferParams<
        { builder: TransactionBuilderType; utxos: UTXOType[] },
        TransactionType
      >,
    ) =>
      transfer({ ...params, getFeeRates: toolbox.getFeeRates, broadcastTx: toolbox.broadcastTx }),
  };
};
