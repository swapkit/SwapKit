import { Chain, type EVMChain, SwapKitError } from "@swapkit/helpers";

import { getProvider } from "../helpers";
import type { EVMToolboxParams } from "../types";
import {
  ARBToolbox,
  AURORAToolbox,
  AVAXToolbox,
  BASEToolbox,
  BERAToolbox,
  BSCToolbox,
  ETHToolbox,
  GNOToolbox,
  MATICToolbox,
} from "./evm";
import { OPToolbox } from "./op";

export async function getEvmToolbox<T extends EVMChain>(chain: T, params?: EVMToolboxParams) {
  const toolboxParams = { ...params, provider: params?.provider || (await getProvider(chain)) };

  switch (chain) {
    case Chain.Arbitrum:
      return ARBToolbox(toolboxParams);
    case Chain.Aurora:
      return AURORAToolbox(toolboxParams);
    case Chain.Avalanche:
      return AVAXToolbox(toolboxParams);
    case Chain.Base:
      return BASEToolbox(toolboxParams);
    case Chain.Berachain:
      return BERAToolbox(toolboxParams);
    case Chain.BinanceSmartChain:
      return BSCToolbox(toolboxParams);
    case Chain.Gnosis:
      return GNOToolbox(toolboxParams);
    case Chain.Optimism:
      return OPToolbox(toolboxParams);
    case Chain.Polygon:
      return MATICToolbox(toolboxParams);
    case Chain.Ethereum:
      return ETHToolbox(toolboxParams);
    default:
      throw new SwapKitError("toolbox_evm_not_supported", { chain });
  }
}

export * from "./baseEVMToolbox";
export * from "./evm";
export * from "./op";
