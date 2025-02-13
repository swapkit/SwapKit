import { Chain, SwapKitNumber } from "@swapkit/helpers";

import { ToolboxFactory, type ToolboxParams } from "./baseSubstrateToolbox";

export const PolkadotToolbox = ({ signer, generic = false }: ToolboxParams) => {
  return ToolboxFactory({ chain: Chain.Polkadot, generic, signer });
};

export const ChainflipToolbox = async ({ signer, generic = false }: ToolboxParams) => {
  const toolbox = await ToolboxFactory({ chain: Chain.Chainflip, generic, signer });

  async function getBalance(address: string) {
    const { api, gasAsset } = toolbox;
    // @ts-expect-error @Towan some parts of data missing?
    // biome-ignore lint/correctness/noUnsafeOptionalChaining: @Towan some parts of data missing?
    const { balance } = await api.query.flip?.account?.(address);

    return [
      toolbox.gasAsset.set(
        SwapKitNumber.fromBigInt(BigInt(balance.toString()), gasAsset.decimal).getValue("string"),
      ),
    ];
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
