import { Chain, type EVMChain } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider } from "ethers";

import { getProvider } from "../helpers";
import type { EVMToolboxParams, EVMToolboxes } from "../types";
import { ARBToolbox, AVAXToolbox, BASEToolbox, BSCToolbox, ETHToolbox, MATICToolbox } from "./evm";
import { OPToolbox } from "./op";

export async function getEvmToolbox<T extends EVMChain>(
  chain: T,
  params?: Omit<EVMToolboxParams, "provider"> & {
    provider?: BrowserProvider | JsonRpcProvider;
  },
) {
  const toolboxParams = {
    ...params,
    provider: params?.provider || (await getProvider(chain)),
  };

  switch (chain) {
    case Chain.Avalanche:
      return AVAXToolbox(toolboxParams) as EVMToolboxes[T];
    case Chain.Arbitrum:
      return ARBToolbox(toolboxParams) as EVMToolboxes[T];
    case Chain.Base:
      return BASEToolbox(toolboxParams) as EVMToolboxes[T];
    case Chain.Optimism:
      return OPToolbox(toolboxParams) as EVMToolboxes[T];
    case Chain.Polygon:
      return MATICToolbox(toolboxParams) as EVMToolboxes[T];
    case Chain.BinanceSmartChain:
      return BSCToolbox(toolboxParams) as EVMToolboxes[T];
    case Chain.Ethereum:
      return ETHToolbox(toolboxParams) as EVMToolboxes[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}

export * from "./baseEVMToolbox";
export * from "./evm";
export * from "./op";
