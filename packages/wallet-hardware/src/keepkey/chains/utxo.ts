import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  Chain,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  FeeOption,
  type GenericTransferParams,
  SwapKitError,
  type UTXOChain,
} from "@swapkit/helpers";
import type { UTXOToolboxes } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import { bip32ToAddressNList, ChainToKeepKeyName } from "../coins";

interface KeepKeyInputObject {
  addressNList: number[];
  scriptType: string;
  amount: string;
  vout: number;
  txid: string;
  hex: string;
}

export async function utxoWalletMethods({
  sdk,
  chain,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  chain: Exclude<UTXOChain, typeof Chain.Zcash>;
  derivationPath?: DerivationPathArray;
}): Promise<
  UTXOToolboxes[UTXOChain] & {
    address: string;
    signTransaction: (psbt: Psbt, inputs: KeepKeyInputObject[], memo?: string) => Promise<string>;
  }
> {
  const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
  // This might not work for BCH
  const toolbox = await getUtxoToolbox(chain);
  const scriptType = [Chain.Bitcoin, Chain.Litecoin].includes(chain as typeof Chain.Bitcoin)
    ? ("p2wpkh" as const)
    : ("p2pkh" as const);

  const derivationPathString = derivationPath ? derivationPathToString(derivationPath) : `${DerivationPath[chain]}/0`;

  const addressInfo = {
    address_n: bip32ToAddressNList(derivationPathString),
    coin: ChainToKeepKeyName[chain],
    script_type: scriptType,
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
            addressType: "change",
            amount: value,
            isChange: true,
            scriptType,
          };
        }

        if (outputAddress) {
          return { address: outputAddress, addressType: "spend", amount: value };
        }

        return null;
      })
      .filter(Boolean);

    const removeNullAndEmptyObjectsFromArray = (arr: any[]) => {
      return arr.filter((item) => item !== null && typeof item === "object" && Object.keys(item).length > 0);
    };

    const responseSign = await sdk.utxo.utxoSignTransaction({
      coin: ChainToKeepKeyName[chain],
      inputs,
      opReturnData: memo,
      outputs: removeNullAndEmptyObjectsFromArray(outputs),
    });

    return responseSign.serializedTx?.toString();
  };

  const transfer = async ({ recipient, feeOptionKey, feeRate, memo, ...rest }: GenericTransferParams) => {
    if (!walletAddress)
      throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "From address must be provided" });
    if (!recipient)
      throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Recipient address must be provided" });

    const createTxMethod =
      chain === Chain.BitcoinCash
        ? (toolbox as UTXOToolboxes["BCH"]).buildTx
        : (toolbox as UTXOToolboxes["BTC"]).createTransaction;

    const { psbt, inputs: rawInputs } = await createTxMethod({
      ...rest,
      feeRate: feeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast],
      fetchTxHex: true,
      memo,
      recipient,
      sender: walletAddress,
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

  return { ...toolbox, address: walletAddress, signTransaction, transfer };
}
