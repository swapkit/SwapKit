import type { DerivationPathArray } from "@swapkit/helpers";
import type { NearSigner } from "@swapkit/toolboxes/near";
import type { SignedTransaction, Transaction } from "near-api-js/lib/transaction";
import { getLedgerTransport } from "../helpers/getLedgerTransport";

export async function getNearLedgerClient(derivationPath?: DerivationPathArray) {
  const Near = (await import("@ledgerhq/hw-app-near")).default;
  const { Chain, NetworkDerivationPath, SwapKitError } = await import("@swapkit/helpers");
  const transport = await getLedgerTransport();
  const nearApp = new Near(transport);

  const path = (derivationPath || NetworkDerivationPath[Chain.Near]).join("'/").concat("'");

  const { address, publicKey: pubKeyHex } = await nearApp.getAddress(path);

  const signer = {
    getAddress() {
      return Promise.resolve(address);
    },
    async getPublicKey() {
      const { utils } = await import("near-api-js");
      return utils.PublicKey.fromString(`ed25519:${pubKeyHex}`);
    },

    signDelegateAction(_delegateAction: any) {
      return Promise.reject(
        new SwapKitError("wallet_ledger_method_not_supported", { method: "signDelegateAction", wallet: "Ledger" }),
      );
    },

    signNep413Message(
      _message: string,
      _accountId: string,
      _recipient: string,
      _nonce: Uint8Array,
      _callbackUrl?: string,
    ) {
      return Promise.reject(
        new SwapKitError("wallet_ledger_method_not_supported", { method: "signNep413Message", wallet: "Ledger" }),
      );
    },

    async signTransaction(transaction: Transaction) {
      const { Signature, SignedTransaction } = await import("near-api-js/lib/transaction");
      try {
        const signatureArray = await nearApp.signTransaction(transaction.encode(), path);
        if (!signatureArray) {
          throw new Error("Signature undefined");
        }

        const signature = new Signature({ data: signatureArray, keyType: 0 });

        const signedTransaction = new SignedTransaction({ signature, transaction });

        return [signatureArray, signedTransaction] as [Uint8Array<ArrayBufferLike>, SignedTransaction];
      } catch (error) {
        throw new SwapKitError("wallet_ledger_signing_error", { error });
      }
    },
  };

  return signer as NearSigner;
}
