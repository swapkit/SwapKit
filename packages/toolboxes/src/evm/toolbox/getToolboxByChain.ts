import { Chain } from "@swapkit/helpers";

import { ARBToolbox } from "./arb";
import { AVAXToolbox } from "./avax";
import { BASEToolbox } from "./base";
import { BSCToolbox } from "./bsc";
import { ETHToolbox } from "./eth";
import { MATICToolbox } from "./matic";
import { OPToolbox } from "./op";

type ToolboxType = {
  ARB: typeof ARBToolbox;
  AVAX: typeof AVAXToolbox;
  BASE: typeof BASEToolbox;
  BSC: typeof BSCToolbox;
  ETH: typeof ETHToolbox;
  MATIC: typeof MATICToolbox;
  OP: typeof OPToolbox;
};

export const getToolboxByChain = <T extends keyof ToolboxType>(chain: T): ToolboxType[T] => {
  switch (chain) {
    case Chain.Avalanche:
      return AVAXToolbox as ToolboxType[T];
    case Chain.Arbitrum:
      return ARBToolbox as ToolboxType[T];
    case Chain.Base:
      return BASEToolbox as ToolboxType[T];
    case Chain.Optimism:
      return OPToolbox as ToolboxType[T];
    case Chain.Polygon:
      return MATICToolbox as ToolboxType[T];
    case Chain.BinanceSmartChain:
      return BSCToolbox as ToolboxType[T];
    case Chain.Ethereum:
      return ETHToolbox as ToolboxType[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};

export { evmValidateAddress } from "./EVMToolbox";
