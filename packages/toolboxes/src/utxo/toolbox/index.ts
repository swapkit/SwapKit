import { Chain, type ChainSigner, type UTXOChain } from "@swapkit/helpers";
import type { Psbt } from "bitcoinjs-lib";

import type { TransactionType, UTXOType } from "../types";
import { type TransactionBuilderType, createBCHToolbox } from "./bitcoinCash";
import { createUTXOToolbox } from "./utxo";

type BCHToolbox = Awaited<ReturnType<typeof createBCHToolbox>>;
type CommonUTXOToolbox = Awaited<ReturnType<typeof createUTXOToolbox>>;

export type UTXOToolboxes = {
  [Chain.BitcoinCash]: BCHToolbox;
  [Chain.Bitcoin]: CommonUTXOToolbox;
  [Chain.Dogecoin]: CommonUTXOToolbox;
  [Chain.Litecoin]: CommonUTXOToolbox;
  [Chain.Dash]: CommonUTXOToolbox;
};

export type UTXOWallets = {
  [key in keyof UTXOToolboxes]: UTXOToolboxes[key];
};

export async function getUtxoToolbox(
  chain: Chain.BitcoinCash,
  signer: ChainSigner<{ builder: TransactionBuilderType; utxos: UTXOType[] }, TransactionType>,
): Promise<BCHToolbox>;

export async function getUtxoToolbox(
  chain: Exclude<UTXOChain, Chain.BitcoinCash>,
  signer: ChainSigner<Psbt, Psbt>,
): Promise<CommonUTXOToolbox>;

export async function getUtxoToolbox(chain: UTXOChain): Promise<CommonUTXOToolbox>;

export async function getUtxoToolbox<T extends UTXOChain>(
  chain: T,
  signer?: ChainSigner<any, any>,
): Promise<UTXOToolboxes[T]> {
  switch (chain) {
    case Chain.BitcoinCash: {
      const toolbox = await createBCHToolbox(signer);
      return toolbox as UTXOToolboxes[T];
    }

    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.Litecoin:
    case Chain.Dash: {
      const toolbox = await createUTXOToolbox(chain, signer);
      return toolbox as UTXOToolboxes[T];
    }

    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}

export { stripToCashAddress, stripPrefix, validateAddress } from "./bitcoinCash";
