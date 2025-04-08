import { AssetValue, Chain } from "@swapkit/helpers";

import { type ToolboxParams, createSubstrateToolbox } from "./substrate";

async function ChainflipToolbox({ signer, generic = false }: ToolboxParams) {
  const toolbox = await createSubstrateToolbox({ chain: Chain.Chainflip, generic, signer });

  async function getBalance(address: string) {
    // @ts-expect-error @Towan some parts of data missing?
    // biome-ignore lint/correctness/noUnsafeOptionalChaining: @Towan some parts of data missing?
    const { balance } = await toolbox.api.query.flip?.account?.(address);

    return [AssetValue.from({ chain: Chain.Chainflip, value: BigInt(balance.toString()) })];
  }

  return { ...toolbox, getBalance };
}

type ToolboxType = {
  DOT: ReturnType<typeof createSubstrateToolbox>;
  FLIP: ReturnType<typeof ChainflipToolbox>;
};

export function getSubstrateToolbox<T extends keyof ToolboxType>(
  chain: T,
  params: ToolboxParams,
): ToolboxType[T] {
  switch (chain) {
    case Chain.Chainflip:
      return ChainflipToolbox(params);
    case Chain.Polkadot:
      return createSubstrateToolbox({ chain: Chain.Polkadot, ...params });

    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}
