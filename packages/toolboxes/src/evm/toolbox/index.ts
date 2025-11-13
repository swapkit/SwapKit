import { Chain, type EVMChain } from "@swapkit/helpers";
import { match } from "ts-pattern";

import { getProvider } from "../helpers";
import type { EVMToolboxes, EVMToolboxParams } from "../types";
import * as evmToolboxes from "./evm";
import { OPToolbox } from "./op";

export async function getEvmToolbox<T extends EVMChain>(chain: T, params?: EVMToolboxParams) {
  const toolboxParams = { ...params, provider: params?.provider || (await getProvider(chain)) };

  type Toolbox = Promise<EVMToolboxes[T]>;

  return (
    match(chain as EVMChain)
      .returnType<Toolbox>()
      .with(Chain.Arbitrum, () => evmToolboxes.ARBToolbox(toolboxParams) as Toolbox)
      .with(Chain.Aurora, () => evmToolboxes.AURORAToolbox(toolboxParams) as Toolbox)
      .with(Chain.Avalanche, () => evmToolboxes.AVAXToolbox(toolboxParams) as Toolbox)
      .with(Chain.Base, () => evmToolboxes.BASEToolbox(toolboxParams) as Toolbox)
      .with(Chain.Berachain, () => evmToolboxes.BERAToolbox(toolboxParams) as Toolbox)
      .with(Chain.BinanceSmartChain, () => evmToolboxes.BSCToolbox(toolboxParams) as Toolbox)
      .with(Chain.Botanix, () => evmToolboxes.SONICToolbox(toolboxParams) as Toolbox)
      .with(Chain.Core, () => evmToolboxes.COREToolbox(toolboxParams) as Toolbox)
      .with(Chain.Corn, () => evmToolboxes.CORNToolbox(toolboxParams) as Toolbox)
      .with(Chain.Cronos, () => evmToolboxes.CROToolbox(toolboxParams) as Toolbox)
      .with(Chain.Ethereum, () => evmToolboxes.ETHToolbox(toolboxParams) as Toolbox)
      .with(Chain.Gnosis, () => evmToolboxes.GNOToolbox(toolboxParams) as Toolbox)
      .with(Chain.Hyperevm, () => evmToolboxes.HYPEREVMToolbox(toolboxParams) as Toolbox)
      .with(Chain.Optimism, () => OPToolbox(toolboxParams) as Toolbox)
      .with(Chain.Polygon, () => evmToolboxes.MATICToolbox(toolboxParams) as Toolbox)
      .with(Chain.Sonic, () => evmToolboxes.SONICToolbox(toolboxParams) as Toolbox)
      .with(Chain.Unichain, () => evmToolboxes.UNIToolbox(toolboxParams) as Toolbox)
      .with(Chain.XLayer, () => evmToolboxes.XLayerToolbox(toolboxParams) as Toolbox)
      // @ts-expect-error TODO: Remove once live
      .with(Chain.Monad, () => evmToolboxes.MONADToolbox(toolboxParams) as Toolbox)
      // @ts-expect-error TODO: Remove once live
      .with(Chain.MegaETH, () => evmToolboxes.MEGAETHToolbox(toolboxParams) as Toolbox)
      .exhaustive()
  );
}

export * from "./baseEVMToolbox";
export * from "./evm";
export * from "./op";
