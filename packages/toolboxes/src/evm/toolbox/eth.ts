import { Chain, FeeOption } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, JsonRpcSigner, Signer } from "ethers";

import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";

import { multicallAbi } from "../contracts/eth/multicall";
import { EVMToolbox } from "./EVMToolbox";

export const ETHToolbox = ({
  signer,
  provider,
}: { signer?: Signer | JsonRpcSigner; provider: JsonRpcProvider | BrowserProvider }) => {
  const evmToolbox = EVMToolbox({ provider, signer });
  const chain = Chain.Ethereum;

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

    return evmToolbox.sendTransaction(txObject, feeOptionKey);
  }

  return {
    ...evmToolbox,
    multicall,
    estimateTransactionFee: (txObject: EVMTxBaseParams, feeOptionKey?: FeeOption) =>
      estimateTransactionFee(txObject, feeOptionKey, chain, provider),
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({ provider: overwriteProvider || provider, address, chain, potentialScamFilter }),
  };
};
