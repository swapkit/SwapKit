import { Chain } from "@swapkit/helpers";

import { createBCHToolbox as BCHToolbox } from "./bitcoinCash";
import { BaseUTXOToolbox } from "./utxo";

type ToolboxType = {
  BCH: typeof BCHToolbox;
  BTC: typeof BTCToolbox;
  DOGE: typeof DOGEToolbox;
  LTC: typeof LTCToolbox;
  DASH: typeof DASHToolbox;
};

export const BTCToolbox = BaseUTXOToolbox(Chain.Bitcoin);
export const DASHToolbox = BaseUTXOToolbox(Chain.Dash);
export const DOGEToolbox = BaseUTXOToolbox(Chain.Dogecoin);
export const LTCToolbox = BaseUTXOToolbox(Chain.Litecoin);

export function getToolboxByChain<T extends keyof ToolboxType>(chain: T): ToolboxType[T] {
  switch (chain) {
    case Chain.BitcoinCash:
      return BCHToolbox as ToolboxType[T];
    case Chain.Bitcoin:
      return BTCToolbox as ToolboxType[T];
    case Chain.Dogecoin:
      return DOGEToolbox as ToolboxType[T];
    case Chain.Litecoin:
      return LTCToolbox as ToolboxType[T];
    case Chain.Dash:
      return DASHToolbox as ToolboxType[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}

export { stripToCashAddress, stripPrefix, validateAddress } from "./bitcoinCash";
export { BCHToolbox };
