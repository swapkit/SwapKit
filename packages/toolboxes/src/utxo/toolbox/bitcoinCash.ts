import { Chain, DerivationPath, FeeOption, type UTXOChain } from "@swapkit/helpers";

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
  TransactionType,
  UTXOBuildTxParams,
  UTXOType,
  UTXOWalletTransferParams,
} from "../types";

import { BaseUTXOToolbox } from "./utxo";

const chain = Chain.BitcoinCash as UTXOChain;

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

export function createBCHToolbox() {
  const { getBalance, getFeeRates, broadcastTx, ...toolbox } = BaseUTXOToolbox(Chain.BitcoinCash)();

  function handleGetBalance(address: string, _scamFilter = true) {
    return getBalance(stripPrefix(toCashAddress(address)));
  }

  return {
    ...toolbox,
    broadcastTx,
    buildBCHTx,
    buildTx,
    createKeysForPath,
    getAddressFromKeys,
    getBalance: handleGetBalance,
    getFeeRates,
    stripPrefix,
    stripToCashAddress,
    validateAddress,
    transfer: transfer({ getFeeRates, broadcastTx }),
  };
}

async function buildBCHTx({ assetValue, recipient, memo, feeRate, sender }: UTXOBuildTxParams) {
  const {
    Transaction,
    TransactionBuilder,
    address: bchAddress,
    // @ts-ignore TODO: check why wallets doesn't see modules included in toolbox
  } = await import("@psf/bitcoincashjs-lib");
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
}

function transfer({
  broadcastTx,
  getFeeRates,
}: {
  broadcastTx: (txHash: string) => Promise<string>;
  getFeeRates: () => Promise<Record<FeeOption, number>>;
}) {
  return async function transfer({
    signTransaction,
    from,
    recipient,
    assetValue,
    ...rest
  }: UTXOWalletTransferParams<
    { builder: TransactionBuilderType; utxos: UTXOType[] },
    TransactionType
  >) {
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
}

async function createKeysForPath({
  phrase,
  derivationPath = `${DerivationPath.BCH}/0`,
  wif,
}: { wif?: string; phrase?: string; derivationPath?: string }) {
  const { ECPairFactory } = await import("ecpair");
  const secp256k1 = await import("@bitcoinerlab/secp256k1");
  const { mnemonicToSeedSync } = await import("@scure/bip39");
  // @ts-ignore TODO: check why wallets doesn't see modules included in toolbox
  const { HDNode } = await import("@psf/bitcoincashjs-lib");

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
}

function getAddressFromKeys(keys: { getAddress: (index?: number) => string }) {
  const address = keys.getAddress(0);
  return stripToCashAddress(address);
}

type TransactionBuilderType = {
  inputs: any[];
  sign(
    vin: number,
    keyPair: { getAddress: (index?: number) => string },
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: number,
    witnessScript?: Buffer,
    signatureAlgorithm?: string,
  ): void;
  build(): TransactionType;
};
