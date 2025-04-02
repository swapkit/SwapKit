import { Chain, type EVMChain, FeeOption } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";
import { getEvmApi } from "../api";
import { multicallAbi } from "../contracts/eth/multicall";
import { getEstimateTransactionFee, getIsEIP1559Compatible, getNetworkParams } from "../helpers";
import { BaseEVMToolbox } from "./baseEVMToolbox";

export function ETHToolbox<P extends JsonRpcProvider | BrowserProvider, S extends Signer>({
  provider,
  signer,
}: { signer?: S; provider: P }) {
  const evmToolbox = createEvmToolbox(Chain.Ethereum)({
    provider,
    signer,
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

export function ARBToolbox<P extends JsonRpcProvider | BrowserProvider, S extends Signer>({
  provider,
  signer,
}: { signer?: S; provider: P }) {
  const { estimateGasPrices: _, ...evmToolbox } = createEvmToolbox(Chain.Arbitrum)({
    provider,
    signer,
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
  return function createEvmToolbox<P extends JsonRpcProvider | BrowserProvider, S extends Signer>({
    provider,
    signer,
  }: { provider: P; signer?: S }) {
    const isEIP1559Compatible = getIsEIP1559Compatible(chain);
    const evmToolbox = BaseEVMToolbox({ provider, signer, isEIP1559Compatible });

    return {
      ...evmToolbox,
      estimateTransactionFee: getEstimateTransactionFee({ provider, isEIP1559Compatible }),
      getNetworkParams: getNetworkParams(chain),
      getBalance: getEvmApi(chain).getBalance,
    };
  };
}
