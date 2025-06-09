import secp256k1 from "@bitcoinerlab/secp256k1";
import { type TransactionBuilder, networks } from "@bitgo/utxo-lib";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import {
  Chain,
  type ChainSigner,
  type DerivationPathArray,
  FeeOption,
  NetworkDerivationPath,
  SKConfig,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import { Psbt, initEccLib } from "bitcoinjs-lib";
import bs58check from "bs58check";
import { P, match } from "ts-pattern";
import { accumulative, compileMemo, getUtxoApi } from "../helpers";
import type { TransactionType, UTXOBuildTxParams, UTXOTransferParams, UTXOType } from "../types";
import { createUTXOToolbox } from "./utxo";

const chain = Chain.Zcash;

// Network constants for Zcash
const ZCASH_NETWORK = {
  messagePrefix: "\x19Zcash Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x1c,
  scriptHash: 0x1c,
  wif: 0x80,
  coin: "zcash",
  name: "Zcash Mainnet",
} as const;

const ZCASH_TESTNET = {
  messagePrefix: "\x19Zcash Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x1d,
  scriptHash: 0x1c,
  wif: 0xef,
  coin: "zcash",
  name: "Zcash Testnet",
} as const;

function getZcashNetwork() {
  const { isStagenet } = SKConfig.get("envs");
  return isStagenet
    ? networks.zcashTest
    : {
        messagePrefix: "\x19Zcash Signed Message:\n",
        bech32: "",
        bip32: {
          public: 0x0488b21e,
          private: 0x0488ade4,
        },
        pubKeyHash: 0x1c, // Use 0x1c (28 decimal) - first byte of Zcash prefix
        scriptHash: 0x1c, // Use 0x1c (28 decimal)
        wif: 0x80,
        coin: "zcash",
        name: "Zcash Mainnet",
      };
}

// Address validation - Zcash specific
export function validateZcashAddress(address: string) {
  try {
    if (address.startsWith("z")) {
      console.warn(
        "Shielded Zcash addresses (z-addresses) are not supported. Use transparent addresses (t1/t3) only.",
      );
      return false;
    }

    if (address.startsWith("t1") || address.startsWith("t3")) {
      return validateBase58Check(address, getZcashNetwork());
    }

    return validateBase58Check(address, ZCASH_TESTNET);
  } catch {
    return false;
  }
}

function validateBase58Check(address: string, network: ReturnType<typeof getZcashNetwork>) {
  try {
    const decoded = bs58check.decode(address);

    if (decoded.length < 21) {
      return false;
    }

    const version = decoded[0];
    return version === network.pubKeyHash || version === network.scriptHash;
  } catch {
    return false;
  }
}

// Async imports for BitGo UTXO lib
const getUtxoLib = async () => await import("@bitgo/utxo-lib");

// Type for Zcash transaction parameters
type ZcashTxParams = {
  txBuilder: TransactionBuilder;
  inputs: UTXOType[];
};

// Use standard ChainSigner for Zcash
type ZcashSigner = ChainSigner<ZcashTxParams, TransactionType>;

// Create signer from phrase - Zcash specific
async function createZcashSignerFromPhrase({
  phrase,
  derivationPath = NetworkDerivationPath[Chain.Zcash],
  index = 0,
}: {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}) {
  const { ECPair, payments, Transaction } = await getUtxoLib();
  const network = getZcashNetwork();
  const seed = mnemonicToSeedSync(phrase);
  const root = HDKey.fromMasterSeed(seed);

  const updatedDerivationPath = updateDerivationPath(derivationPath, { index });
  const pathString = derivationPathToString(updatedDerivationPath);
  const node = root.derive(pathString);

  if (!node.privateKey) {
    throw new Error("Unable to derive private key");
  }

  const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network });

  const address = (() => {
    const { address } = payments.p2pkh({
      pubkey: keyPair.publicKey,
      network,
    });
    if (!address) {
      throw new Error("Unable to generate address");
    }
    return address;
  })();

  return {
    getAddress() {
      return Promise.resolve(address);
    },

    signTransaction({ txBuilder, inputs }: ZcashTxParams) {
      for (let i = 0; i < inputs.length; i++) {
        txBuilder.sign(i, keyPair, Buffer.alloc(0), Transaction.SIGHASH_ALL, inputs[i]?.value || 0);
      }
      return Promise.resolve(txBuilder.build());
    },
  };
}

// Zcash-specific transaction building
async function createZcashTransaction(params: UTXOBuildTxParams) {
  const { bitgo } = await getUtxoLib();
  const network = getZcashNetwork();

  if (!validateZcashAddress(params.recipient)) {
    throw new Error("Invalid Zcash address");
  }

  const api = getUtxoApi(Chain.Zcash);
  const utxos = await api.scanUTXOs({ address: params.sender });

  const targets = [
    {
      address: params.recipient,
      value: params.assetValue.getBaseValue("number"),
    },
  ];

  const coinselectUTXOs = utxos.map((utxo) => ({
    hash: utxo.hash,
    index: utxo.index,
    value: utxo.value,
    address: params.sender,
  }));

  const { inputs, outputs } = accumulative({
    inputs: coinselectUTXOs,
    outputs: targets,
    feeRate: params.feeRate,
    chain: Chain.Zcash,
  });

  if (!(inputs && outputs)) {
    throw new Error("Insufficient balance for transaction");
  }

  const txBuilder = bitgo.createTransactionBuilderForNetwork(network);

  for (const input of inputs) {
    txBuilder.addInput(input.hash, input.index);
  }

  for (const output of outputs) {
    const outputAddress = "address" in output && output.address ? output.address : params.sender;
    txBuilder.addOutput(outputAddress, output.value);
  }

  if (params.memo) {
    const memoScript = Buffer.concat([
      Buffer.from([0x6a]), // OP_RETURN
      Buffer.from([params.memo.length]),
      Buffer.from(params.memo, "utf8"),
    ]);
    txBuilder.addOutput(memoScript, 0);
  }

  return {
    txBuilder,
    inputs,
    outputs,
    utxos,
  };
}

// Helper function to add inputs to PSBT
function addInputsToPsbt(psbt: Psbt, inputs: UTXOType[]) {
  for (const utxo of inputs) {
    const witnessInfo = !!utxo.witnessUtxo && { witnessUtxo: utxo.witnessUtxo };
    const nonWitnessInfo = utxo.txHex && {
      nonWitnessUtxo: Buffer.from(utxo.txHex, "hex"),
    };

    psbt.addInput({
      hash: utxo.hash,
      index: utxo.index,
      ...witnessInfo,
      ...nonWitnessInfo,
    });
  }
}

// Helper function to add outputs to PSBT
function addOutputsToPsbt(
  psbt: Psbt,
  outputs: Array<{ address?: string; value: number; script?: Buffer }>,
  sender: string,
  compiledMemo: Buffer | null,
) {
  for (const output of outputs) {
    const address = "address" in output && output.address ? output.address : sender;
    const hasOutputScript = "script" in output && output.script;

    if (hasOutputScript && !compiledMemo) {
      continue;
    }

    const mappedOutput = hasOutputScript
      ? { script: compiledMemo as Buffer, value: 0 }
      : { address, value: output.value };

    psbt.addOutput(mappedOutput);
  }
}

// PSBT-based transaction creation for Zcash
async function createPsbtTransaction(params: UTXOBuildTxParams): Promise<{
  psbt: Psbt;
  utxos: UTXOType[];
  inputs: UTXOType[];
}> {
  if (!validateZcashAddress(params.recipient)) {
    throw new Error("Invalid Zcash address");
  }

  const network = getZcashNetwork();
  const compiledMemo = params.memo ? await compileMemo(params.memo) : null;

  const api = getUtxoApi(Chain.Zcash);
  const utxos = await api.scanUTXOs({ address: params.sender, fetchTxHex: true });

  const targets: Array<
    { address: string; value: number } | { address: string; script: Buffer; value: number }
  > = [
    {
      address: params.recipient,
      value: params.assetValue.getBaseValue("number"),
    },
  ];

  if (params.memo && compiledMemo) {
    targets.push({ address: "", script: compiledMemo, value: 0 });
  }

  const { inputs, outputs } = accumulative({
    inputs: utxos,
    outputs: targets,
    feeRate: params.feeRate,
    chain: Chain.Zcash,
  });

  if (!(inputs && outputs)) {
    throw new Error("Insufficient balance for transaction");
  }

  initEccLib(secp256k1);
  const psbt = new Psbt({ network });

  addInputsToPsbt(psbt, inputs);
  addOutputsToPsbt(psbt, outputs, params.sender, compiledMemo);

  return {
    psbt,
    utxos,
    inputs,
  };
}

// Transfer function that uses Zcash-specific logic
function transfer({
  broadcastTx,
  getFeeRates,
  signer,
}: {
  broadcastTx: (txHash: string) => Promise<string>;
  getFeeRates: () => Promise<Record<FeeOption, number>>;
  signer?: ZcashSigner;
}) {
  return async function transfer({
    recipient,
    assetValue,
    feeOptionKey = FeeOption.Fast,
    ...rest
  }: UTXOTransferParams) {
    const from = await signer?.getAddress();
    if (!(signer && from)) throw new Error("Signer must provide address");
    if (!recipient) throw new Error("Recipient address must be provided");

    const feeRate = rest.feeRate || (await getFeeRates())[feeOptionKey];

    // Use Zcash-specific transaction creation
    const buildTxParams: UTXOBuildTxParams = {
      ...rest,
      assetValue,
      feeRate,
      recipient,
      sender: from,
    };

    const { txBuilder, inputs } = await createZcashTransaction(buildTxParams);
    const tx = await signer.signTransaction({ txBuilder, inputs });
    const txHex = tx.toHex();

    return broadcastTx(txHex);
  };
}

export async function createZcashToolbox(
  toolboxParams:
    | {
        signer?: ZcashSigner;
      }
    | {
        phrase?: string;
        derivationPath?: DerivationPathArray;
        index?: number;
      },
) {
  const signer = await match(toolboxParams)
    .with({ signer: P.not(P.nullish) }, ({ signer }) => Promise.resolve(signer))
    .with({ phrase: P.string }, ({ phrase, derivationPath, index = 0 }) =>
      createZcashSignerFromPhrase({ phrase, derivationPath, index }),
    )
    .otherwise(() => Promise.resolve(undefined));

  function getAddress() {
    return signer?.getAddress();
  }

  debugger;

  // Get base UTXO toolbox and destructure methods
  const { getBalance, getFeeRates, broadcastTx, ...toolbox } = await createUTXOToolbox({ chain });

  // Zcash-specific createKeysForPath since base UTXO doesn't support Zcash
  async function createKeysForPath(params: { phrase: string; derivationPath: string }) {
    const { ECPair, payments } = await getUtxoLib();
    const network = getZcashNetwork();
    const seed = mnemonicToSeedSync(params.phrase);
    const root = HDKey.fromMasterSeed(seed);

    const derivationArray = params.derivationPath
      .split("/")
      .slice(1)
      .map(Number) as DerivationPathArray;
    const pathString = `m/${derivationArray.join("/")}`;
    const node = root.derive(pathString);

    if (!node.privateKey) {
      throw new Error("Unable to derive private key");
    }

    const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network });
    const { address } = payments.p2pkh({
      pubkey: keyPair.publicKey,
      network,
    });

    return {
      getAddress: () => address || "",
      publicKey: keyPair.publicKey.toString("hex"),
      privateKey: keyPair.privateKey?.toString("hex") || "",
      toWIF: () => keyPair.toWIF(),
    };
  }

  function getAddressFromKeys(keys: { getAddress: () => string }) {
    return keys.getAddress();
  }

  return {
    ...toolbox, // Inherit all base UTXO methods
    getAddress,
    broadcastTx,
    createTransaction: createZcashTransaction, // Override with Zcash-specific implementation
    createPsbtTransaction, // PSBT-based transaction creation
    createKeysForPath, // Override with Zcash-specific implementation
    getAddressFromKeys,
    getBalance,
    getFeeRates,
    validateAddress: validateZcashAddress, // Override with Zcash-specific validation
    transfer: transfer({ getFeeRates, broadcastTx, signer }), // Override with Zcash-specific transfer
    getPrivateKeyFromMnemonic: async (params: { phrase: string; derivationPath: string }) => {
      const keys = await createKeysForPath(params);
      return keys.toWIF();
    },
  };
}
