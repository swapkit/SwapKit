import type { UtxoPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  Chain,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  SwapKitError,
  type UTXOChain,
} from "@swapkit/helpers";
import { stripToCashAddress } from "@swapkit/toolboxes/utxo";
import { type Psbt, script, Transaction } from "bitcoinjs-lib";
import { bip32ToAddressNList, ChainToKeepKeyName } from "../coins";

export const utxoWalletMethods = async ({
  sdk,
  chain,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  chain: Exclude<UTXOChain, Chain.Zcash>;
  derivationPath?: DerivationPathArray;
}) => {
  const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
  // This might not work for BCH
  const scriptType = [Chain.Bitcoin, Chain.Litecoin].includes(chain) ? ("p2wpkh" as const) : ("p2pkh" as const);

  const derivationPathString = derivationPath ? derivationPathToString(derivationPath) : `${DerivationPath[chain]}/0`;

  const addressInfo = {
    address_n: bip32ToAddressNList(derivationPathString),
    coin: ChainToKeepKeyName[chain],
    script_type: scriptType,
  };

  const walletAddress: string = (await sdk.address.utxoGetAddress(addressInfo)).address;

  function psbtToKeepKeyParams(psbt: Psbt | UtxoPsbt) {
    // 1. Map Inputs (logic remains the same)
    const inputs = psbt.data.inputs.map((input, index) => {
      const txInput = psbt.txInputs[index];
      let utxoValue: number;
      let utxoHex: string;

      // ---- THIS IS THE CRITICAL LOGIC ----
      if (input.witnessUtxo) {
        // Use this path for SegWit inputs (BTC, LTC)
        utxoValue = Number(input.witnessUtxo.value);

        // KeepKey's `hex` field requires the full transaction. If the PSBT creator
        // only provided a witnessUtxo, we may need to fetch the full transaction hex here.
        // A well-formed PSBT for KeepKey should probably include it anyway.
        if (input.nonWitnessUtxo) {
          utxoHex = input.nonWitnessUtxo.toString("hex");
        } else {
          // You would need a helper here to fetch the raw transaction from a block explorer
          utxoHex = "";
        }
      } else if (input.nonWitnessUtxo) {
        // Use this path for Non-SegWit inputs (BCH, DOGE, legacy BTC/LTC)
        const prevTx = Transaction.fromBuffer(input.nonWitnessUtxo);
        utxoValue = prevTx.outs[txInput?.index || 0]?.value || 0;
        utxoHex = input.nonWitnessUtxo.toString("hex");
      } else {
        // This is an invalid PSBT for signing; it's missing the necessary UTXO info.
        throw new Error(`PSBT input ${index} is missing both witnessUtxo and nonWitnessUtxo.`);
      }
      // ------------------------------------

      const bip32Derivation = input.bip32Derivation?.[0];
      if (!bip32Derivation) {
        throw new Error(`PSBT input ${index} is missing derivation path required by KeepKey.`);
      }

      // ... logic to determine scriptType from the UTXO's script ...

      return {
        addressNList: addressInfo.address_n,
        amount: utxoValue.toString(),
        hex: utxoHex,
        scriptType,
        txid: txInput?.hash.toString("hex"),
        vout: txInput?.index,
      };
    });

    // 2. MAP OUTPUTS & SEPARATE THE MEMO (OP_RETURN)
    let opReturnData = "";
    const outputs = psbt.txOutputs
      .map((output) => {
        const { value, address, change } = output as {
          address: string;
          script: Buffer;
          value: number;
          change?: boolean;
        };

        const outputAddress = chain === Chain.BitcoinCash ? stripToCashAddress(address) : address;

        if (output.script && output.script[0] === 0x6a) {
          // An OP_RETURN script always starts with the byte 0x6a.
          // ---- THIS IS THE CORRECTED LOGIC ----
          // KeepKey expects a clear string, so we decode the buffer as UTF-8.
          opReturnData = output.script.slice(1).toString("utf8");
          // ------------------------------------
          return null; // Exclude OP_RETURN from outputs
        }

        if (change || address === walletAddress) {
          return { address: output.address, addressType: "change", amount: value, isChange: true, scriptType };
        }

        if (outputAddress) {
          // This is a RECIPIENT output
          return { address: outputAddress, addressType: "spend", amount: value };
        }

        return null;
      })
      .filter(Boolean);

    // 3. Return the final object for KeepKey
    return {
      inputs,
      opReturnData, // This is now a clear string, e.g., "for my friend"
      outputs,
    };
  }

  const signTransaction = async <T extends Psbt | UtxoPsbt>(psbt: T) => {
    const { inputs, opReturnData: memo, outputs } = psbtToKeepKeyParams(psbt);

    // const outputs = psbt.txOutputs
    //   .map((output) => {
    //     const { value, address, change } = output as {
    //       address: string;
    //       script: Buffer;
    //       value: number;
    //       change?: boolean;
    //     };

    //     const outputAddress =
    //       // @ts-expect-error - stripToCashAddress is not defined in the UTXO toolbox just only on BCH
    //       chain === Chain.BitcoinCash ? toolbox.stripToCashAddress(address) : address;

    //     if (change || address === walletAddress) {
    //       return {
    //         addressNList: addressInfo.address_n,
    //         addressType: "change",
    //         amount: value,
    //         isChange: true,
    //         scriptType,
    //       };
    //     }

    //     if (outputAddress) {
    //       return { address: outputAddress, addressType: "spend", amount: value };
    //     }

    //     return null;
    //   })
    //   .filter(Boolean);

    const removeNullAndEmptyObjectsFromArray = (arr: any[]) => {
      return arr.filter((item) => item !== null && typeof item === "object" && Object.keys(item).length > 0);
    };

    const responseSign = await sdk.utxo.utxoSignTransaction({
      coin: ChainToKeepKeyName[chain],
      inputs,
      opReturnData: memo,
      outputs: removeNullAndEmptyObjectsFromArray(outputs),
    });

    if (responseSign.serializedTx) {
      // 3. PARSE the finalized transaction hex back into a transaction object
      const finalTx = Transaction.fromHex(responseSign.serializedTx.toString());

      // 4. EXTRACT the signatures and UPDATE the original PSBT
      psbt.data.inputs.forEach((input, index) => {
        const finalTxInput = finalTx.ins[index];

        if (!finalTxInput || !finalTxInput.script) {
          throw new SwapKitError("wallet_keepkey_signing_error", {
            error: `Could not find a valid signature script in the final transaction for input ${index}`,
          });
        }

        if (!input.bip32Derivation || !input.bip32Derivation[0]) {
          return; // Cannot add signature without pubkey info from original PSBT
        }

        // The finalTxInput.script contains the fully assembled scriptSig.
        // We can pass this directly to the psbt's finalizer methods,
        // or for consistency, add it to the partialSig map.
        // NOTE: For a simple P2PKH, the script is [signature, pubkey].
        // The `psbt.updateInput` is the cleanest way to add this back.
        // We are essentially taking the "answer" from the final tx and putting it
        // into our PSBT's "worksheet".

        const pubkey = input.bip32Derivation[0].pubkey;

        // Decompile the script to extract just the signature
        // Note: This can be complex. For P2PKH, the first push is the signature.
        const chunks = script.decompile(finalTxInput.script);
        if (!chunks || chunks.length < 2) {
          throw new SwapKitError("wallet_keepkey_signing_error", {
            error: `Unexpected script format in final transaction for input ${index}`,
          });
        }
        const signature = chunks[0] as Buffer;

        psbt.updateInput(index, { partialSig: [{ pubkey, signature }] });
      });

      // 5. Return the updated PSBT, which now contains KeepKey's signature
      return psbt;
    }
    throw new SwapKitError("wallet_keepkey_signing_error", {
      error: "KeepKey did not return a serialized transaction",
    });
  };

  const signer = { getAddress: async () => walletAddress, signTransaction: signTransaction };

  const toolbox = await getUtxoToolbox<Exclude<UTXOChain, Chain.Zcash>>(chain, { signer });

  //   const signAndBroadcastTransaction = async (psbt: Psbt) => {
  //     const txHex = await signTransaction(psbt as Psbt);
  //     return toolbox.broadcastTx(txHex);
  //   };

  //   const transfer = async ({ recipient, feeOptionKey, feeRate, memo, ...rest }: GenericTransferParams) => {
  //     if (!walletAddress)
  //       throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "From address must be provided" });
  //     if (!recipient)
  //       throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Recipient address must be provided" });

  //     const createTxMethod =
  //       chain === Chain.BitcoinCash
  //         ? (toolbox as UTXOToolboxes["BCH"]).createTransaction
  //         : (toolbox as UTXOToolboxes["BTC"]).createTransaction;

  //     const { psbt } = await createTxMethod({
  //       ...rest,
  //       feeRate: feeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast],
  //       fetchTxHex: true,
  //       memo,
  //       recipient,
  //       sender: walletAddress,
  //     });

  //     const txHex = await signTransaction(psbt as Psbt);
  //     return toolbox.broadcastTx(txHex);
  //   };

  return { ...toolbox, address: walletAddress };
};
