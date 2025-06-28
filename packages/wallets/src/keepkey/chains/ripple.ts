import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  Chain,
  DerivationPath,
  type DerivationPathArray,
  type GenericTransferParams,
  derivationPathToString,
} from "@swapkit/helpers";
import { bip32ToAddressNList } from "../coins";

import { getRippleToolbox } from "@swapkit/toolboxes/ripple";

export const rippleWalletMethods = async ({
  sdk,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  derivationPath?: DerivationPathArray;
}) => {
  // Derivation path handling (default to standard XRP 44'/144'/0'/0/0)
  const derivationPathString = derivationPath
    ? derivationPathToString(derivationPath)
    : `${DerivationPath[Chain.Ripple]}/0`;

  // Fetch address from KeepKey
  // @ts-ignore - keepkey-sdk typings may not yet include xrpGetAddress
  const { address } = await (sdk as any).address.xrpGetAddress({
    address_n: bip32ToAddressNList(derivationPathString),
  });

  // Inject minimal signer so toolbox's address helpers work
  const signer = {
    getAddress: () => Promise.resolve(address),
    signTransaction: () => {
      throw new Error("signTransaction not supported via toolbox");
    },
  };

  const toolbox = await getRippleToolbox({ signer });

  const transfer = async ({ recipient, assetValue, memo }: GenericTransferParams) => {
    // Build XRPL Payment tx using toolbox helper
    const tx = await toolbox.createTransaction({
      assetValue,
      recipient,
      memo,
      sender: address,
    });

    // Convert toolbox Payment tx into KeepKey StdTx wrapper (KeepKey-specific format)
    const stdTx = {
      type: "auth/StdTx",
      value: {
        fee: {
          amount: [
            {
              amount: "1000",
              denom: "drop",
            },
          ],
          gas: "28000",
        },
        memo: memo && memo.length > 0 ? memo : "",
        msg: [
          {
            type: "ripple-sdk/MsgSend",
            value: {
              amount: [
                {
                  amount: tx.Amount,
                  denom: "drop",
                },
              ],
              from_address: address,
              to_address: recipient,
            },
          },
        ],
        signatures: null,
      },
    };

    const unsignedTx = {
      addressNList: bip32ToAddressNList(derivationPathString),
      tx: stdTx,
      flags: tx.Flags === 0 ? undefined : tx.Flags,
      lastLedgerSequence: tx.LastLedgerSequence?.toString(),
      sequence: (tx.Sequence ?? 0).toString(),
      payment: {
        amount: tx.Amount,
        destination: tx.Destination,
        destinationTag: (tx.DestinationTag ?? "0").toString(),
      },
    } as any;

    // Sign with KeepKey
    // @ts-ignore - typings missing
    const responseSign = JSON.parse(await (sdk as any).xrp.xrpSignTransaction(unsignedTx));

    // keepkey-sdk may return either { tx_blob } or StdTx with Base64 serializedTx
    const txBlob: string | undefined =
      (responseSign as any).tx_blob ?? (responseSign as any).value?.signatures?.[0]?.serializedTx;
    if (!txBlob) throw new Error("KeepKey XRP sign failed");

    const buffer = Buffer.from(txBlob, "base64");
    const txBlobHex = buffer.toString("hex");

    // Broadcast signed tx via toolbox
    return toolbox.broadcastTransaction(txBlobHex);
  };

  return {
    ...toolbox,
    address,
    getAddress: () => address,
    transfer,
  };
};
