import { Chain, type UTXOChain } from "@swapkit/helpers";

import { createBCHToolbox } from "./bitcoinCash";
import { createUTXOToolbox } from "./utxo";

type BCHToolbox = Awaited<ReturnType<typeof createBCHToolbox>>;
type CommonUTXOToolbox = Awaited<ReturnType<typeof createUTXOToolbox>>;

type UTXOToolboxes = {
  [Chain.BitcoinCash]: BCHToolbox;
  [Chain.Bitcoin]: CommonUTXOToolbox;
  [Chain.Dogecoin]: CommonUTXOToolbox;
  [Chain.Litecoin]: CommonUTXOToolbox;
  [Chain.Dash]: CommonUTXOToolbox;
};

export type UTXOWallets = {
  [key in keyof UTXOToolboxes]: UTXOToolboxes[key];
};

export function getUtxoToolbox<T extends UTXOChain>(chain: T) {
  switch (chain) {
    case Chain.BitcoinCash: {
      return createBCHToolbox() as Promise<UTXOToolboxes[T]>;
    }

    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.Litecoin:
    case Chain.Dash: {
      return createUTXOToolbox(chain) as Promise<UTXOToolboxes[T]>;
    }

    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}

export { stripToCashAddress, stripPrefix, validateAddress } from "./bitcoinCash";
export { getAddressValidator, createUTXOToolbox } from "./utxo";
