import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  Chain,
  DerivationPath,
  type DerivationPathArray,
  FeeOption,
  type UTXOChain,
  derivationPathToString,
} from "@swapkit/helpers";
import type { UTXOTransferParams } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";

import { ChainToKeepKeyName, bip32ToAddressNList } from "../coins";

interface KeepKeyInputObject {
  addressNList: number[];
  scriptType: string;
  amount: string;
  vout: number;
  txid: string;
  hex: string;
}

export const utxoWalletMethods = async ({
  sdk,
  chain,
  derivationPath,
}: { sdk: KeepKeySdk; chain: UTXOChain; derivationPath?: DerivationPathArray }) => {
  const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
  const toolbox = await getUtxoToolbox(chain);
  const scriptType = [Chain.Bitcoin, Chain.Litecoin].includes(chain)
    ? ("p2wpkh" as const)
    : ("p2pkh" as const);

  const derivationPathString = derivationPath
    ? derivationPathToString(derivationPath)
    : `${DerivationPath[chain]}/0`;

  const addressInfo = {
    coin: ChainToKeepKeyName[chain],
    script_type: scriptType,
    address_n: bip32ToAddressNList(derivationPathString),
  };

  const walletAddress: string = (await sdk.address.utxoGetAddress(addressInfo)).address;

  const signTransaction = async (psbt: Psbt, inputs: KeepKeyInputObject[], memo = "") => {
    const outputs = psbt.txOutputs
      .map((output) => {
        const { value, address, change } = output as {
          address: string;
          script: Buffer;
          value: number;
          change?: boolean;
        };

        const outputAddress =
          // @ts-expect-error - stripToCashAddress is not defined in the UTXO toolbox just only on BCH
          chain === Chain.BitcoinCash ? toolbox.stripToCashAddress(address) : address;

        if (change || address === walletAddress) {
          return {
            addressNList: addressInfo.address_n,
            isChange: true,
            addressType: "change",
            amount: value,
            scriptType,
          };
        }

        if (outputAddress) {
          return { address: outputAddress, amount: value, addressType: "spend" };
        }

        return null;
      })
      .filter(Boolean);

    const removeNullAndEmptyObjectsFromArray = (arr: any[]) => {
      return arr.filter(
        (item) => item !== null && typeof item === "object" && Object.keys(item).length > 0,
      );
    };

    const responseSign = await sdk.utxo.utxoSignTransaction({
      coin: ChainToKeepKeyName[chain],
      inputs,
      outputs: removeNullAndEmptyObjectsFromArray(outputs),
      opReturnData: memo,
    });

    return responseSign.serializedTx?.toString();
  };

  const transfer = async ({
    from,
    recipient,
    feeOptionKey,
    feeRate,
    memo,
    ...rest
  }: UTXOTransferParams) => {
    if (!from) throw new Error("From address must be provided");
    if (!recipient) throw new Error("Recipient address must be provided");

    const { psbt, inputs: rawInputs } = await toolbox.buildTx({
      ...rest,
      memo,
      recipient,
      feeRate: feeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast],
      sender: from,
      fetchTxHex: chain === Chain.BitcoinCash,
    });

    const inputs = rawInputs.map(({ value, index, hash, txHex }) => ({
      //@TODO don't hardcode master, lookup on blockbook what input this is for and what path that address is!
      addressNList: addressInfo.address_n,
      amount: value.toString(),
      hex: txHex || "",
      scriptType,
      txid: hash,
      vout: index,
    }));

    const txHex = await signTransaction(psbt, inputs, memo);
    return toolbox.broadcastTx(txHex);
  };

  return { ...toolbox, signTransaction, transfer, address: walletAddress };
};
