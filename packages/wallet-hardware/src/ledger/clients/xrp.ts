import type Xrp from "@ledgerhq/hw-app-xrp";
import type Transport from "@ledgerhq/hw-transport";
import { Chain, type DerivationPathArray, derivationPathToString, NetworkDerivationPath } from "@swapkit/helpers";
import type { Transaction } from "@swapkit/toolboxes/ripple";
import { encode } from "ripple-binary-codec";
import type { Payment } from "xrpl";
import { getLedgerTransport } from "../helpers";

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

async function establishConnection(transport: Transport) {
  const { default: Xrp } = await import("@ledgerhq/hw-app-xrp");
  return new Xrp(transport);
}

function fetchAddressAndPublicKey({ instance, derivationPath }: { instance: Xrp; derivationPath: string }) {
  return instance.getAddress(derivationPath);
}

export const XRPLedger = async (derivationPath?: DerivationPathArray) => {
  const path = derivationPathToString(derivationPath || NetworkDerivationPath[Chain.Ripple]);
  const transport = await getLedgerTransport();
  const xrpInstance = await establishConnection(transport);

  const { address, publicKey } = await fetchAddressAndPublicKey({ derivationPath: path, instance: xrpInstance });

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
