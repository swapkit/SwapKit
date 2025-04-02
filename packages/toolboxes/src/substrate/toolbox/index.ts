import { Chain } from "@swapkit/helpers";

import { getBalance } from "../../utils";
import { ToolboxFactory, type ToolboxParams } from "./baseSubstrateToolbox";

export const PolkadotToolbox = ({ signer, generic = false }: ToolboxParams) => {
  return ToolboxFactory({ chain: Chain.Polkadot, generic, signer });
};

export const ChainflipToolbox = async ({ signer, generic = false }: ToolboxParams) => {
  const toolbox = await ToolboxFactory({ chain: Chain.Chainflip, generic, signer });

  return { ...toolbox, getBalance: getBalance(Chain.Chainflip) };
};

type ToolboxType = {
  DOT: ReturnType<typeof PolkadotToolbox>;
  FLIP: ReturnType<typeof ChainflipToolbox>;
};

export const getToolboxByChain = <T extends keyof ToolboxType>(
  chain: T,
  params: ToolboxParams,
): ToolboxType[T] => {
  switch (chain) {
    case Chain.Chainflip:
      return ChainflipToolbox(params);
    case Chain.Polkadot:
      return PolkadotToolbox(params);
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};
