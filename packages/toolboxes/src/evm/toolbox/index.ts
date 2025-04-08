import { Chain } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import { getProvider } from "../helpers";
import { ARBToolbox, AVAXToolbox, BASEToolbox, BSCToolbox, ETHToolbox, MATICToolbox } from "./evm";
import { OPToolbox } from "./op";

export type EVMWallets = {
  [Chain.Arbitrum]: ReturnType<typeof ARBToolbox>;
  [Chain.Avalanche]: ReturnType<typeof AVAXToolbox>;
  [Chain.Base]: ReturnType<typeof BASEToolbox>;
  [Chain.BinanceSmartChain]: ReturnType<typeof BSCToolbox>;
  [Chain.Ethereum]: ReturnType<typeof ETHToolbox>;
  [Chain.Optimism]: ReturnType<typeof OPToolbox>;
  [Chain.Polygon]: ReturnType<typeof MATICToolbox>;
};

export async function getEvmToolbox<T extends keyof EVMWallets>(
  chain: T,
  params?: {
    provider?: BrowserProvider | JsonRpcProvider;
    signer?: Signer;
  },
) {
  const toolboxParams = {
    ...params,
    provider: params?.provider || (await getProvider(chain)),
  };

  switch (chain) {
    case Chain.Avalanche:
      return AVAXToolbox(toolboxParams) as EVMWallets[T];
    case Chain.Arbitrum:
      return ARBToolbox(toolboxParams) as EVMWallets[T];
    case Chain.Base:
      return BASEToolbox(toolboxParams) as EVMWallets[T];
    case Chain.Optimism:
      return OPToolbox(toolboxParams) as EVMWallets[T];
    case Chain.Polygon:
      return MATICToolbox(toolboxParams) as EVMWallets[T];
    case Chain.BinanceSmartChain:
      return BSCToolbox(toolboxParams) as EVMWallets[T];
    case Chain.Ethereum:
      return ETHToolbox(toolboxParams) as EVMWallets[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}

export * from "./baseEVMToolbox";
export * from "./evm";
export * from "./op";
