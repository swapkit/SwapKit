import Xrp from "@ledgerhq/hw-app-xrp";
import type Transport from "@ledgerhq/hw-transport";
import { Chain, type DerivationPathArray, derivationPathToString, NetworkDerivationPath } from "@swapkit/helpers";
import type { Transaction } from "@swapkit/toolboxes/ripple";
import { encode } from "ripple-binary-codec";
import type { Payment } from "xrpl";
import { getLedgerTransport } from "../helpers/getLedgerTransport";

const TF_FULLY_CANONICAL_SIG = 2147483648;

function cleanTransactionObject(obj: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

function establishConnection(transport: Transport) {
  return new Xrp(transport);
}

export const XRPLedger = async (derivationPath?: DerivationPathArray) => {
  const path = derivationPathToString(derivationPath || NetworkDerivationPath[Chain.Ripple]);
  const transport = await getLedgerTransport();
  const xrpInstance = establishConnection(transport);

  const { address, publicKey } = await xrpInstance.getAddress(path);

  async function sign(transaction: Payment | Transaction) {
    const { hashes } = await import("@swapkit/toolboxes/ripple");
    const cleanedTxWithPubKey = cleanTransactionObject(transaction);
    const transactionJSON = {
      ...cleanedTxWithPubKey,
      Flags: transaction.Flags || TF_FULLY_CANONICAL_SIG,
      SigningPubKey: publicKey.toUpperCase(),
    };

    const transactionToSignOnLedger = encode(transactionJSON);
    const txnSignature = await xrpInstance.signTransaction(path, transactionToSignOnLedger);
    const tx_blob = encode({ ...transactionJSON, TxnSignature: txnSignature });
    const hash = hashes.hashSignedTx(tx_blob);

    return { hash, tx_blob };
  }

  return { address, sign };
};
