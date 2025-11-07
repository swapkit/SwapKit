/**
 * Internal type definitions for UTXO toolbox parameters.
 * These are not exported from the package to avoid leaking third-party library types.
 */

import type { ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import { Chain, type ChainSigner } from "@swapkit/helpers";
import type { Psbt } from "bitcoinjs-lib";
import type { TransactionBuilderType, TransactionType, UTXOType } from "../types";

export type UtxoToolboxParams = {
  [Chain.BitcoinCash]: { signer: ChainSigner<{ builder: TransactionBuilderType; utxos: UTXOType[] }, TransactionType> };
  [Chain.Bitcoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Dogecoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Litecoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Dash]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Zcash]: { signer?: ChainSigner<ZcashPsbt, ZcashPsbt> };
};
