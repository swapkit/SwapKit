import { Chain } from "@swapkit/helpers";

import { ARBToolbox, AURORAToolbox, AVAXToolbox, BASEToolbox, BSCToolbox, ETHToolbox, GNOToolbox, MATICToolbox } from "./evm";
import { OPToolbox } from "./op";

type ToolboxType = {
  ARB: typeof ARBToolbox;
  AURORA: typeof AURORAToolbox;
  AVAX: typeof AVAXToolbox;
  BASE: typeof BASEToolbox;
  BSC: typeof BSCToolbox;
  ETH: typeof ETHToolbox;
  GNO: typeof GNOToolbox;
  MATIC: typeof MATICToolbox;
  OP: typeof OPToolbox;
};

export const getToolboxByChain = <T extends keyof ToolboxType>(chain: T): ToolboxType[T] => {
  switch (chain) {
    case Chain.Arbitrum:
      return ARBToolbox as ToolboxType[T];
    case Chain.Aurora:
      return AURORAToolbox as ToolboxType[T];
    case Chain.Avalanche:
      return AVAXToolbox as ToolboxType[T];
    case Chain.Base:
      return BASEToolbox as ToolboxType[T];
    case Chain.BinanceSmartChain:
      return BSCToolbox as ToolboxType[T];
    case Chain.Ethereum:
      return ETHToolbox as ToolboxType[T];
    case Chain.Gnosis:
      return GNOToolbox as ToolboxType[T]:
    case Chain.Optimism:
      return OPToolbox as ToolboxType[T];
    case Chain.Polygon:
      return MATICToolbox as ToolboxType[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};

export { evmValidateAddress } from "./baseEVMToolbox";
