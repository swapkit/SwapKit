import {
  type DerivationPathArray,
  LedgerErrorCode,
  NetworkDerivationPath,
  SwapKitError,
} from "@swapkit/helpers";

import { THORChainApp } from "../clients/thorchain/lib";
import { getLedgerTransport } from "../helpers/getLedgerTransport";

export abstract class CosmosLedgerInterface {
  ledgerTimeout = 50000;
  derivationPath: DerivationPathArray | string = NetworkDerivationPath.GAIA;
  transport: any;
  ledgerApp: any;
  chain: "thor" | "cosmos" = "thor";

  checkOrCreateTransportAndLedger = async (forceReconnect = false) => {
    if (!forceReconnect && this.transport && this.ledgerApp) return;

    try {
      this.transport =
        forceReconnect || !this.transport ? await getLedgerTransport() : this.transport;

      // biome-ignore lint/style/useDefaultSwitchClause: default will never be hit
      switch (this.chain) {
        case "thor": {
          this.ledgerApp =
            forceReconnect || !this.ledgerApp ? new THORChainApp(this.transport) : this.ledgerApp;

          break;
        }

        case "cosmos": {
          const CosmosApp = (await import("@ledgerhq/hw-app-cosmos")).default;
          this.ledgerApp =
            forceReconnect || !this.ledgerApp ? new CosmosApp(this.transport) : this.ledgerApp;
        }
      }

      return this.ledgerApp;
    } catch (error: unknown) {
      throw new SwapKitError("wallet_ledger_connection_error", error);
    }
  };

  validateResponse = (errorCode: LedgerErrorCode, message?: string) => {
    switch (errorCode) {
      case LedgerErrorCode.NoError:
        return;

      case LedgerErrorCode.LockedDevice:
        throw new SwapKitError("wallet_ledger_device_locked", {
          message: `Ledger is locked: ${message}`,
        });

      case LedgerErrorCode.TC_NotFound:
        throw new SwapKitError("wallet_ledger_device_not_found");

      default: {
        break;
      }
    }
  };
}
