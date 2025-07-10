import {
  Chain,
  type ChainSigner,
  type DerivationPathArray,
  SwapKitError,
  type UTXOChain,
} from "@swapkit/helpers";
import type { Psbt } from "bitcoinjs-lib";

import type { TransactionBuilderType, TransactionType, UTXOType } from "../types";
import { createBCHToolbox } from "./bitcoinCash";
import { createUTXOToolbox } from "./utxo";
import { createZcashToolbox } from "./zcash";

type BCHToolbox = Awaited<ReturnType<typeof createBCHToolbox>>;
type CommonUTXOToolbox = Awaited<
  ReturnType<typeof createUTXOToolbox<Exclude<UTXOChain, Chain.BitcoinCash | Chain.Zcash>>>
>;
type ZcashToolbox = Awaited<ReturnType<typeof createZcashToolbox>>;

export type UTXOToolboxes = {
  [Chain.BitcoinCash]: BCHToolbox;
  [Chain.Bitcoin]: CommonUTXOToolbox;
  [Chain.Dogecoin]: CommonUTXOToolbox;
  [Chain.Litecoin]: CommonUTXOToolbox;
  [Chain.Dash]: CommonUTXOToolbox;
  [Chain.Zcash]: ZcashToolbox;
};

export type UTXOWallets = {
  [key in keyof UTXOToolboxes]: UTXOToolboxes[key];
};

export type UtxoToolboxParams = {
  [Chain.BitcoinCash]: {
    signer: ChainSigner<{ builder: TransactionBuilderType; utxos: UTXOType[] }, TransactionType>;
  };
  [Chain.Bitcoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Dogecoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Litecoin]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Dash]: { signer: ChainSigner<Psbt, Psbt> };
  [Chain.Zcash]: {
    signer?: ChainSigner<Psbt, Psbt>;
  };
};

export async function getUtxoToolbox<T extends keyof UTXOToolboxes>(
  chain: T,
  params?:
    | UtxoToolboxParams[T]
    | {
        phrase?: string;
        derivationPath?: DerivationPathArray;
        index?: number;
      },
): Promise<UTXOToolboxes[T]> {
  switch (chain) {
    case Chain.BitcoinCash: {
      const toolbox = await createBCHToolbox(
        (params as UtxoToolboxParams[Chain.BitcoinCash]) || {},
      );
      return toolbox as UTXOToolboxes[T];
    }

    case Chain.Zcash: {
      const toolbox = await createZcashToolbox(params as UtxoToolboxParams[Chain.Zcash]);
      return toolbox as UTXOToolboxes[T];
    }

    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.Litecoin:
    case Chain.Dash: {
      const toolbox = await createUTXOToolbox({
        chain,
        ...(params as UtxoToolboxParams[Exclude<T, Chain.BitcoinCash | Chain.Zcash>]),
      });
      return toolbox as UTXOToolboxes[Exclude<T, Chain.BitcoinCash | Chain.Zcash>];
    }

    default:
      throw new SwapKitError("toolbox_utxo_not_supported", { chain });
  }
}

export {
  stripToCashAddress,
  stripPrefix,
  bchValidateAddress,
} from "./bitcoinCash";
