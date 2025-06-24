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
import type { Psbt } from "bitcoinjs-lib";
import { hash160 } from "bitcoinjs-lib/src/crypto";
import bs58check from "bs58check";
import ECPairFactory from "ecpair";
import { P, match } from "ts-pattern";
import { getUtxoNetwork } from "../helpers";
import type { UTXOBuildTxParams, UTXOTransferParams } from "../types";
import { createUTXOToolbox } from "./utxo";

const chain = Chain.Zcash;
const network = getUtxoNetwork()(chain);

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

function validateBase58Check(
  address: string,
  network: ReturnType<ReturnType<typeof getUtxoNetwork>>,
) {
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

const ECPair = ECPairFactory(secp256k1);

type ZcashSigner = ChainSigner<Psbt, Psbt>;

async function createZcashSignerFromPhrase({
  phrase,
  derivationPathString,
}: {
  phrase: string;
  derivationPathString: string;
}) {
  const seed = mnemonicToSeedSync(phrase);
  const root = HDKey.fromMasterSeed(seed);

  const node = root.derive(derivationPathString);

  if (!node.privateKey) {
    throw new Error("Unable to derive private key");
  }

  const keyPair = ECPair.fromPrivateKey(Buffer.from(node.privateKey), { network });

  const { isStagenet } = SKConfig.get("envs");
  const address = generateZcashAddress(keyPair.publicKey, isStagenet);

  return {
    getAddress() {
      return Promise.resolve(address);
    },

    signTransaction(psbt: Psbt) {
      for (let i = 0; i < psbt.inputCount; i++) {
        psbt.signInput(i, keyPair);
      }
      return Promise.resolve(psbt);
    },
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
    .with({ phrase: P.string }, ({ phrase, derivationPath, index = 0 }) => {
      // Handle derivation path processing at toolbox level
      const baseDerivationPath = derivationPath ||
        NetworkDerivationPath[Chain.Zcash] || [44, 133, 0, 0, 0];
      const updatedDerivationPath = updateDerivationPath(baseDerivationPath, { index });
      const derivationPathString = derivationPathToString(updatedDerivationPath);

      return createZcashSignerFromPhrase({ phrase, derivationPathString });
    })
    .otherwise(() => Promise.resolve(undefined));

  const { getFeeRates, broadcastTx, ...toolbox } = await createUTXOToolbox({
    chain: Chain.Zcash,
    signer,
  });

  function getAddressFromKeys(keys: { getAddress: () => string }) {
    return keys.getAddress();
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

    const buildTxParams: UTXOBuildTxParams = {
      ...rest,
      assetValue,
      feeRate,
      recipient,
      sender: from,
    };

    const { psbt } = await toolbox.createTransaction(buildTxParams);
    const signedPsbt = await signer.signTransaction(psbt);
    signedPsbt.finalizeAllInputs();
    const txHex = signedPsbt.extractTransaction().toHex();

    return broadcastTx(txHex);
  }

  return {
    ...toolbox,
    broadcastTx,
    getFeeRates,
    transfer,
    getAddressFromKeys,
    validateAddress: validateZcashAddress,
  };
}
