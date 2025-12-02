/**
 * Internal type definitions for UTXO toolbox parameters.
 * These are not exported from the package to avoid leaking third-party library types.
 */

import type { UtxoPsbt, ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import { Chain, type ChainSigner } from "@swapkit/helpers";
import type { Psbt } from "bitcoinjs-lib";

export type UtxoToolboxParams = {
  [Chain.BitcoinCash]: { signer: ChainSigner<UtxoPsbt, UtxoPsbt> };
  [Chain.Bitcoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Dogecoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Litecoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Dash]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Zcash]: { signer?: ChainSigner<ZcashPsbt, ZcashPsbt> };
};
