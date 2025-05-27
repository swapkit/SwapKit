import Xrp from "@ledgerhq/hw-app-xrp";
import type Transport from "@ledgerhq/hw-transport";
import { hashes } from "@swapkit/toolbox-ripple";
import type { AsyncXrpSigner, Transaction } from "@swapkit/toolbox-ripple";
import { encode } from "ripple-binary-codec";
import type { Payment } from "xrpl";
import { getLedgerTransport } from "../helpers";

function cleanTransactionObject(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

function establishConnection(transport: Transport): Xrp {
  return new Xrp(transport);
}

function fetchAddressAndPublicKey(xrpInstance: Xrp) {
  return xrpInstance.getAddress("44'/144'/0'/0/0");
}

export const LedgerXrpSigner = async (): Promise<AsyncXrpSigner> => {
  const transport = await getLedgerTransport();
  const xrpInstance = await establishConnection(transport);

  const { address, publicKey } = await fetchAddressAndPublicKey(xrpInstance);

  async function sign(transaction: Payment | Transaction) {
    const cleanedTxWithPubKey = cleanTransactionObject(transaction);
    const transactionJSON = {
      ...cleanedTxWithPubKey,
      Flags: transaction.Flags || 2147483648, // default to tfFullyCanonicalSig
      SigningPubKey: publicKey.toUpperCase(),
    };

    const transactionToSignOnLedger = encode(transactionJSON);

    const txnSignature = await xrpInstance.signTransaction(
      "44'/144'/0'/0/0",
      transactionToSignOnLedger,
    );

    const signedTx = { ...transactionJSON, TxnSignature: txnSignature };

    const tx_blob = encode(signedTx);

    const hash = hashes.hashSignedTx(tx_blob);

    return { tx_blob, hash };
  }

  return { address, sign };
};
