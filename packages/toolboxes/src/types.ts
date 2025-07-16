import { type BaseWallet, Chain } from "@swapkit/helpers";

import type { CosmosWallets, ThorchainWallets } from "./cosmos";
import type { EVMToolboxes } from "./evm";
import type { NearWallet } from "./near";
import type { RadixWallet } from "./radix";
import type { RippleWallet } from "./ripple";
import type { SolanaWallet } from "./solana";
import type { SubstrateToolboxes } from "./substrate";
import type { TronWallet } from "./tron";
import type { UTXOToolboxes } from "./utxo";

export type FullWallet = BaseWallet<
  EVMToolboxes &
    UTXOToolboxes &
    CosmosWallets &
    ThorchainWallets &
    SubstrateToolboxes & {
      [Chain.Radix]: RadixWallet;
      [Chain.Ripple]: RippleWallet;
      [Chain.Solana]: SolanaWallet;
      [Chain.Tron]: TronWallet;
      [Chain.Near]: NearWallet;
    }
>;
