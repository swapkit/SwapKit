import type Transport from "@ledgerhq/hw-transport";
import type { DerivationPathArray } from "@swapkit/helpers";
import type { NearSigner } from "@swapkit/toolboxes/near";
import type { SignedTransaction, Transaction } from "near-api-js/lib/transaction";

export async function getNearLedgerClient(transport: Transport, derivationPath?: DerivationPathArray) {
  const Near = await import("@ledgerhq/hw-app-near");
  const { Chain, DerivationPath, derivationPathToString, SwapKitError } = await import("@swapkit/helpers");
  const nearApp = new Near.default(transport);

  // NEAR uses m/44'/397'/0'/0'/0' by default
  const path = derivationPath ? derivationPathToString(derivationPath) : DerivationPath[Chain.Near];

  // Get address and public key from Ledger
  const { address, publicKey: pubKeyHex } = await nearApp.getAddress(path);

  const signer = {
    getAddress() {
      return Promise.resolve(address);
    },
    async getPublicKey() {
      const { utils } = await import("near-api-js");
      // Convert hex public key to NEAR PublicKey format
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
      // Most NEAR Ledger apps don't support arbitrary message signing
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
