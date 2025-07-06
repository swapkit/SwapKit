import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";

import type { getNearLedgerClient } from "../clients/near";
import type { TronLedger } from "../clients/tron";
import type { XRPLedger } from "../clients/xrp";
import type { LEDGER_SUPPORTED_CHAINS } from "../index";
import type { CosmosLedgerClients, EVMLedgerClients, UTXOLedgerClients } from "../types";
import type { getLedgerClient } from "./getLedgerClient";

export const getLedgerAddress = async <
  T extends (typeof LEDGER_SUPPORTED_CHAINS)[number],
  L extends Awaited<ReturnType<typeof getLedgerClient<T>>>,
>({
  chain,
  ledgerClient,
}: {
  chain: T;
  ledgerClient: L;
}) => {
  if (!ledgerClient) return "";

  switch (chain) {
    case Chain.Cosmos:
    case Chain.THORChain: {
      return (ledgerClient as CosmosLedgerClients).connect();
    }

    case Chain.Ethereum:
    case Chain.BinanceSmartChain:
    case Chain.Avalanche:
    case Chain.Polygon:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Base: {
      return (ledgerClient as EVMLedgerClients).getAddress();
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const ledger = ledgerClient as UTXOLedgerClients;
      await ledger.connect();
      const address = await ledger.getAddress();

      return chain === Chain.BitcoinCash ? address.replace("bitcoincash:", "") : address;
    }

    case Chain.Near: {
      return await (ledgerClient as Awaited<ReturnType<typeof getNearLedgerClient>>).getAddress();
    }

    case Chain.Ripple: {
      return (ledgerClient as Awaited<ReturnType<typeof XRPLedger>>).address;
    }

    case Chain.Tron: {
      return (ledgerClient as Awaited<ReturnType<typeof TronLedger>>).getAddress();
    }

    default:
      throw new SwapKitError("wallet_chain_not_supported", { wallet: WalletOption.LEDGER, chain });
  }
};
