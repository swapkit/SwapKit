import type TronApp from "@ledgerhq/hw-app-trx";
import {
  type DerivationPathArray,
  NetworkDerivationPath,
  SwapKitError,
  derivationPathToString,
} from "@swapkit/helpers";
import type { TronSigner, TronTransaction } from "@swapkit/toolboxes/tron";

import { getLedgerTransport } from "../helpers/getLedgerTransport";

export class TronLedgerInterface implements TronSigner {
  derivationPath: string;
  ledgerApp: InstanceType<typeof TronApp> | null = null;
  ledgerTimeout = 50000;

  constructor(derivationPath?: DerivationPathArray | string) {
    this.derivationPath =
      typeof derivationPath === "string"
        ? derivationPath
        : derivationPathToString(derivationPath || NetworkDerivationPath.TRX);
  }

  checkOrCreateTransportAndLedger = async () => {
    if (this.ledgerApp) return;
    await this.createTransportAndLedger();
  };

  createTransportAndLedger = async () => {
    const transport = await getLedgerTransport();
    const TronApp = (await import("@ledgerhq/hw-app-trx")).default;

    this.ledgerApp = new TronApp(transport);
  };

  getAddress = async (): Promise<string> => {
    const response = await this.getAddressAndPubKey();
    if (!response) throw new SwapKitError("wallet_ledger_failed_to_get_address");
    return response.address;
  };

  getAddressAndPubKey = async () => {
    await this.createTransportAndLedger();
    const result = await this.ledgerApp?.getAddress(this.derivationPath);

    if (!result) throw new SwapKitError("wallet_ledger_failed_to_get_address");

    return {
      address: result.address,
      publicKey: result.publicKey,
    };
  };

  showAddressAndPubKey = async () => {
    await this.createTransportAndLedger();
    return this.ledgerApp?.getAddress(this.derivationPath, true);
  };

  signTransaction = async (transaction: TronTransaction) => {
    await this.createTransportAndLedger();

    if (!this.ledgerApp) {
      throw new SwapKitError("wallet_ledger_transport_error");
    }

    // Tron transactions need to be serialized before signing
    const serializedTx = JSON.stringify(transaction);

    try {
      const signature = await this.ledgerApp.signTransaction(
        this.derivationPath,
        serializedTx,
        [], // Token signatures array - empty for native TRX transfers
      );

      if (!signature) {
        throw new SwapKitError("wallet_ledger_signing_error");
      }

      // Return the signed transaction in Tron's expected format
      return {
        ...transaction,
        signature: [signature],
      };
    } catch (error) {
      throw new SwapKitError("wallet_ledger_signing_error", { error });
    }
  };
}

export const TronLedger = (derivationPath?: DerivationPathArray) =>
  new TronLedgerInterface(derivationPath);
