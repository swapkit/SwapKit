/**
 * @fileoverview Zcash UTXO Toolbox Implementation
 *
 * This module provides a comprehensive toolbox for interacting with the Zcash blockchain,
 * specifically supporting transparent addresses (t1 mainnet, t3 testnet).
 *
 * Key Features:
 * - Custom address generation handling Zcash's 2-byte prefixes
 * - PSBT-based transaction building for compatibility
 * - Full compatibility with SwapKit UTXO patterns
 * - Support for memos via OP_RETURN outputs
 * - Comprehensive fee estimation and UTXO management
 *
 * Limitations:
 * - Only supports transparent addresses (no shielded z-addresses)
 * - Uses custom network configuration due to BitGo incompatibility
 *
 * @author SwapKit Team
 * @version 1.0.0
 */

import secp256k1 from "@bitcoinerlab/secp256k1";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import {
  Chain,
  type ChainSigner,
  type DerivationPathArray,
  FeeOption,
  NetworkDerivationPath,
  SKConfig,
  SwapKitError,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import { Psbt, initEccLib } from "bitcoinjs-lib";
import { hash160 } from "bitcoinjs-lib/src/crypto";
import bs58check from "bs58check";
import { P, match } from "ts-pattern";
import { getBalance } from "../../utils";
import { accumulative, calculateTxSize, compileMemo, getUtxoApi } from "../helpers";
import type { UTXOBuildTxParams, UTXOTransferParams, UTXOType } from "../types";

const chain = Chain.Zcash;

// Define Zcash network objects that match ECPair's expected interface
const ZCASH_MAINNET = {
  messagePrefix: "\x19Zcash Signed Message:\n",
  bech32: "zc",
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x1c, // 28 in decimal - correct for Zcash mainnet
  scriptHash: 0x1c, // 28 in decimal
  wif: 0x80, // 128 in decimal
};

const ZCASH_TESTNET = {
  messagePrefix: "\x19Zcash Signed Message:\n",
  bech32: "ztestsapling",
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x1d, // 29 in decimal - correct for Zcash testnet
  scriptHash: 0x1c, // 28 in decimal
  wif: 0xef, // 239 in decimal
};

// Get Zcash network configuration using our custom objects
function getZcashNetwork() {
  const { isStagenet } = SKConfig.get("envs");
  return isStagenet ? ZCASH_TESTNET : ZCASH_MAINNET;
}

/**
 * Custom Zcash address generation that handles 2-byte prefixes
 *
 * Zcash transparent addresses use 2-byte version prefixes, unlike Bitcoin's single byte.
 * This is incompatible with bitcoinjs-lib's payment methods which expect UInt8 values.
 *
 * @param publicKey - The public key buffer to generate address from
 * @param isTestnet - Whether to generate testnet or mainnet address
 * @returns A valid Zcash transparent address (t1... for mainnet, tm... for testnet)
 */
function generateZcashAddress(publicKey: Buffer, isTestnet = false): string {
  // Hash the public key using RIPEMD160(SHA256(pubkey))
  const publicKeyHash = hash160(publicKey);

  // Zcash uses 2-byte prefixes for transparent addresses
  // These prefixes ensure addresses start with expected characters when base58 encoded
  const prefix = isTestnet
    ? Buffer.from([0x1c, 0xba]) // testnet prefix (results in tm... addresses)
    : Buffer.from([0x1c, 0xb8]); // mainnet prefix (results in t1... addresses)

  // Combine prefix + hash (22 bytes total: 2 byte prefix + 20 byte hash)
  const payload = Buffer.concat([prefix, publicKeyHash]);

  // Encode with base58check for final address
  return bs58check.encode(payload);
}

export function validateZcashAddress(address: string) {
  try {
    // Shielded addresses are not supported
    if (address.startsWith("z")) {
      console.warn(
        "Shielded Zcash addresses (z-addresses) are not supported. Use transparent addresses (t1/t3) only.",
      );
      return false;
    }

    const network = getZcashNetwork();

    const isMainnet = address.startsWith("t1");
    const isTestnet = address.startsWith("t3");

    if (!(isMainnet || isTestnet)) {
      return false;
    }

    // Verify network matches address type
    const { isStagenet } = SKConfig.get("envs");
    if ((isMainnet && isStagenet) || (isTestnet && !isStagenet)) {
      return false;
    }

    return validateBase58Check(address, network);
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

const getUtxoLib = async () => await import("@bitgo/utxo-lib");

type ZcashSigner = ChainSigner<Psbt, Psbt>;

// Create signer from phrase - Zcash specific using PSBT
async function createZcashSignerFromPhrase({
  phrase,
  derivationPathString,
}: {
  phrase: string;
  derivationPathString: string; // Expects the final derivation path string
}) {
  const { ECPair } = await getUtxoLib();
  const network = getZcashNetwork();
  const seed = mnemonicToSeedSync(phrase);
  const root = HDKey.fromMasterSeed(seed);

  const node = root.derive(derivationPathString);

  if (!node.privateKey) {
    throw new Error("Unable to derive private key");
  }

  const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network });

  // Use custom Zcash address generation
  const { isStagenet } = SKConfig.get("envs");
  const address = generateZcashAddress(keyPair.publicKey, isStagenet);

  return {
    getAddress() {
      return Promise.resolve(address);
    },

    signTransaction(psbt: Psbt) {
      // Sign all inputs in the PSBT
      for (let i = 0; i < psbt.inputCount; i++) {
        psbt.signInput(i, keyPair);
      }
      return Promise.resolve(psbt);
    },
  };
}

// Helper function to add inputs to PSBT
function addInputsToPsbt(psbt: Psbt, inputs: UTXOType[]) {
  for (const utxo of inputs) {
    const witnessInfo = !!utxo.witnessUtxo && {
      witnessUtxo: {
        ...utxo.witnessUtxo,
        value: utxo.witnessUtxo.value,
      },
    };
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
async function createPsbtTransaction(params: UTXOBuildTxParams) {
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

/**
 * Creates a comprehensive Zcash toolbox for blockchain interactions
 *
 * This toolbox provides full UTXO functionality specifically tailored for Zcash,
 * including custom address generation, PSBT-based transactions, and comprehensive
 * fee estimation. It maintains compatibility with the SwapKit UTXO interface
 * while handling Zcash-specific requirements.
 *
 * @param toolboxParams - Configuration object containing either a signer or phrase-based setup
 * @param toolboxParams.signer - Pre-configured Zcash signer instance
 * @param toolboxParams.phrase - BIP39 mnemonic phrase for key derivation
 * @param toolboxParams.derivationPath - Custom derivation path (defaults to Zcash standard)
 * @param toolboxParams.index - Account index for derivation (defaults to 0)
 *
 * @returns Promise resolving to a complete Zcash toolbox with all UTXO methods
 *
 * @example
 * ```typescript
 * // Create toolbox with mnemonic
 * const toolbox = await createZcashToolbox({
 *   phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
 *   index: 0
 * });
 *
 * // Get address
 * const address = await toolbox.getAddress(); // Returns t1... address
 *
 * // Validate address
 * const isValid = toolbox.validateAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F");
 *
 * // Create transaction
 * const { psbt } = await toolbox.createTransaction({
 *   recipient: "t1...",
 *   assetValue: AssetValue.from({ chain: Chain.Zcash, value: "0.001" }),
 *   sender: address,
 *   feeRate: 1000,
 *   memo: "Hello Zcash!"
 * });
 * ```
 */
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
    .with({ phrase: P.string }, ({ phrase, derivationPath, index = 0 }) => {
      // Handle derivation path processing at toolbox level
      const baseDerivationPath = derivationPath ||
        NetworkDerivationPath[Chain.Zcash] || [44, 133, 0, 0, 0];
      const updatedDerivationPath = updateDerivationPath(baseDerivationPath, { index });
      const derivationPathString = derivationPathToString(updatedDerivationPath);

      return createZcashSignerFromPhrase({ phrase, derivationPathString });
    })
    .otherwise(() => Promise.resolve(undefined));

  function getAddress() {
    return signer?.getAddress();
  }

  async function getFeeRates() {
    const suggestedFeeRate = await getUtxoApi(chain).getSuggestedTxFee();
    return {
      [FeeOption.Average]: suggestedFeeRate,
      [FeeOption.Fast]: Math.floor(suggestedFeeRate * 1.5),
      [FeeOption.Fastest]: Math.floor(suggestedFeeRate * 2),
    };
  }

  function broadcastTx(txHash: string) {
    return getUtxoApi(chain).broadcastTx(txHash);
  }

  // Zcash-specific createKeysForPath since base UTXO doesn't support Zcash
  async function createKeysForPath(params: { phrase: string; derivationPath: string }) {
    const { ECPair } = await getUtxoLib();
    const network = getZcashNetwork();
    const seed = mnemonicToSeedSync(params.phrase);
    const root = HDKey.fromMasterSeed(seed);

    // Use the derivation path string directly since HDKey.derive handles the parsing
    const node = root.derive(params.derivationPath);

    if (!node.privateKey) {
      throw new Error("Unable to derive private key");
    }

    const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network });

    // Use custom Zcash address generation
    const { isStagenet } = SKConfig.get("envs");
    const address = generateZcashAddress(keyPair.publicKey, isStagenet);

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
    const api = getUtxoApi(chain);
    const utxos = await api.scanUTXOs({ address: sender });

    const targets = [
      { address: recipient, value: Number(assetValue.bigIntValue) },
      ...(memo ? [{ address: "", script: await compileMemo(memo), value: 0 }] : []),
    ];

    const feeRateWhole = feeRate ? Math.floor(feeRate) : (await getFeeRates())[feeOptionKey];

    return accumulative({ inputs: utxos, outputs: targets, feeRate: feeRateWhole, chain });
  }

  async function estimateTransactionFee(params: {
    assetValue: InstanceType<typeof import("@swapkit/helpers").AssetValue>;
    recipient: string;
    sender: string;
    memo?: string;
    feeOptionKey?: FeeOption;
    feeRate?: number;
    fetchTxHex?: boolean;
  }) {
    const inputFees = await getInputsOutputsFee(params);
    const { AssetValue } = await import("@swapkit/helpers");

    return AssetValue.from({
      chain,
      value: inputFees.fee.toString(),
    });
  }

  async function estimateMaxSendableAmount({
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
    recipients?: number;
  }) {
    const { AssetValue } = await import("@swapkit/helpers");
    const api = getUtxoApi(chain);
    const addressData = await api.getAddressData(from);
    const feeRateWhole = feeRate ? Math.ceil(feeRate) : (await getFeeRates())[feeOptionKey];

    if (!addressData?.utxo?.length) {
      return AssetValue.from({ chain });
    }

    const totalBalance = addressData.utxo.reduce((sum, utxo) => sum + utxo.value, 0);
    const balance = AssetValue.from({ chain, value: totalBalance });

    // Estimate transaction size and fee
    const outputs = Array.from({ length: recipients }, () => ({ address: from, value: 0 }));
    if (memo) {
      outputs.push({ address: from, value: 0 });
    }

    const txSize = calculateTxSize({
      inputs: addressData.utxo.map((utxo) => ({
        ...utxo,
        hash: utxo.transaction_hash,
        type: 0,
      })),
      outputs,
      feeRate: feeRateWhole,
    });

    const fee = txSize * feeRateWhole;
    return balance.sub(fee);
  }

  async function transfer({
    recipient,
    assetValue,
    feeOptionKey = FeeOption.Fast,
    ...rest
  }: UTXOTransferParams) {
    const from = await signer?.getAddress();
    if (!(signer && from)) throw new SwapKitError("toolbox_utxo_no_signer");

    const feeRate = rest.feeRate || (await getFeeRates())[feeOptionKey];

    // Use PSBT-based transaction creation
    const buildTxParams: UTXOBuildTxParams = {
      ...rest,
      assetValue,
      feeRate,
      recipient,
      sender: from,
    };

    const { psbt } = await createPsbtTransaction(buildTxParams);
    const signedPsbt = await signer.signTransaction(psbt);
    signedPsbt.finalizeAllInputs();
    const txHex = signedPsbt.extractTransaction().toHex();

    return broadcastTx(txHex);
  }

  return {
    // Core functionality
    getAddress,
    broadcastTx,
    getBalance: getBalance(chain),
    getFeeRates,

    // Transaction methods
    createTransaction: createPsbtTransaction, // Use PSBT-based transaction creation
    createPsbtTransaction, // PSBT-based transaction creation

    /**
     * Transfer Zcash using PSBT-based transaction building
     */
    transfer,

    getInputsOutputsFee,
    estimateTransactionFee,
    estimateMaxSendableAmount,

    // Key and address methods
    createKeysForPath,
    getAddressFromKeys,
    validateAddress: validateZcashAddress,
    getPrivateKeyFromMnemonic: async (params: { phrase: string; derivationPath: string }) => {
      const keys = await createKeysForPath(params);
      return keys.toWIF();
    },

    // Helper methods
    accumulative,
    calculateTxSize,
  };
}
