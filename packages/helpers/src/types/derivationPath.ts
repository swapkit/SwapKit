import { AllChains, type Chain, getChainConfig } from "@swapkit/types";

export type DerivationPathArray = ReturnType<typeof getChainConfig>["networkDerivationPath"];

export const NetworkDerivationPath = AllChains.reduce(
  (acc, chain) => {
    acc[chain] = getChainConfig(chain).networkDerivationPath;
    return acc;
  },
  {} as Record<Chain, DerivationPathArray>,
);
