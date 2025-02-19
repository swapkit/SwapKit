import { AssetValue, Chain } from "@swapkit/helpers";

import { ToolboxFactory, type ToolboxParams } from "./baseSubstrateToolbox";

export const PolkadotToolbox = ({ signer, generic = false }: ToolboxParams) => {
  return ToolboxFactory({ chain: Chain.Polkadot, generic, signer });
};

export const ChainflipToolbox = async ({ signer, generic = false }: ToolboxParams) => {
  const toolbox = await ToolboxFactory({ chain: Chain.Chainflip, generic, signer });

  async function getBalance(address: string) {
    // @ts-expect-error @Towan some parts of data missing?
    // biome-ignore lint/correctness/noUnsafeOptionalChaining: @Towan some parts of data missing?
    const { balance } = await toolbox.api.query.flip?.account?.(address);

    return [AssetValue.from({ chain: Chain.Chainflip, value: BigInt(balance.toString()) })];
  }

  return { ...toolbox, getBalance };
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
