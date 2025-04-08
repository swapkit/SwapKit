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

export async function getUtxoToolbox<T extends UTXOChain>(chain: T): Promise<UTXOToolboxes[T]> {
  switch (chain) {
    case Chain.BitcoinCash: {
      const toolbox = await createBCHToolbox();
      return toolbox as UTXOToolboxes[T];
    }

    case Chain.Bitcoin:
    case Chain.Dogecoin:
    case Chain.Litecoin:
    case Chain.Dash: {
      const toolbox = await createUTXOToolbox(chain);
      return toolbox as UTXOToolboxes[T];
    }

    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}

export { stripToCashAddress, stripPrefix, validateAddress } from "./bitcoinCash";
