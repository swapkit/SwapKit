import { Chain, type EVMChain, FeeOption, SKConfig } from "@swapkit/helpers";
import { HDNodeWallet } from "ethers";
import { getEvmApi } from "../api";
import { multicallAbi } from "../contracts/eth/multicall";
import {
  getEstimateTransactionFee,
  getIsEIP1559Compatible,
  getNetworkParams,
  getProvider,
} from "../helpers";
import type { EVMToolboxParams } from "../types";
import { BaseEVMToolbox } from "./baseEVMToolbox";

export async function ETHToolbox({ provider, ...signer }: EVMToolboxParams) {
  const evmToolbox = await createEvmToolbox(Chain.Ethereum)({
    provider,
    ...signer,
  });
  async function multicall(
    callTuples: { address: string; data: string }[],
    multicallAddress = "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
    funcName = "aggregate",
    feeOptionKey: FeeOption = FeeOption.Fast,
  ) {
    const txObject = await evmToolbox.createContractTxObject({
      contractAddress: multicallAddress,
      abi: multicallAbi,
      funcName,
      funcParams: [callTuples],
    });

    return evmToolbox.sendTransaction({ ...txObject, feeOptionKey });
  }

  return { ...evmToolbox, multicall };
}

export async function ARBToolbox({ provider: providerParam, ...signer }: EVMToolboxParams) {
  const chain = Chain.Arbitrum;
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const provider = providerParam || (await getProvider(chain, rpcUrl));

  const { estimateGasPrices: _, ...evmToolbox } = await createEvmToolbox(Chain.Arbitrum)({
    provider,
    ...signer,
  });

  async function estimateGasPrices() {
    try {
      const { gasPrice } = await provider.getFeeData();

      if (!gasPrice) throw new Error("No fee data available");

      return {
        [FeeOption.Average]: { gasPrice },
        [FeeOption.Fast]: { gasPrice },
        [FeeOption.Fastest]: { gasPrice },
      };
    } catch (error) {
      throw new Error(
        `Failed to estimate gas price: ${(error as any).msg ?? (error as any).toString()}`,
      );
    }
  }

  return { ...evmToolbox, estimateGasPrices };
}

export const AVAXToolbox = createEvmToolbox(Chain.Avalanche);
export const BASEToolbox = createEvmToolbox(Chain.Base);
export const BSCToolbox = createEvmToolbox(Chain.BinanceSmartChain);
export const MATICToolbox = createEvmToolbox(Chain.Polygon);

function createEvmToolbox<C extends EVMChain>(chain: C) {
  return async function createEvmToolbox({
    provider: providerParam,
    ...toolboxSignerParams
  }: EVMToolboxParams) {
    const rpcUrl = SKConfig.get("rpcUrls")[chain];

    const provider = providerParam || (await getProvider(chain, rpcUrl));

    const isEIP1559Compatible = getIsEIP1559Compatible(chain);
    const signer =
      "phrase" in toolboxSignerParams && toolboxSignerParams.phrase
        ? HDNodeWallet.fromPhrase(toolboxSignerParams.phrase).connect(provider)
        : "signer" in toolboxSignerParams
          ? toolboxSignerParams.signer
          : undefined;

    const evmToolbox = BaseEVMToolbox({ provider, signer, isEIP1559Compatible });

    return {
      ...evmToolbox,
      estimateTransactionFee: getEstimateTransactionFee({ provider, isEIP1559Compatible }),
      getNetworkParams: getNetworkParams(chain),
      getBalance: getEvmApi(chain).getBalance,
    };
  };
}
