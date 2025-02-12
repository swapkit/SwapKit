import { Chain, FeeOption } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, JsonRpcSigner, Signer } from "ethers";

import type { EthplorerApiType } from "../api/ethplorerApi";
import { ethplorerApi } from "../api/ethplorerApi";
import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";

import { multicallAbi } from "../contracts/eth/multicall";
import { EVMToolbox } from "./EVMToolbox";

export const ETHToolbox = ({
  api,
  apiKey,
  signer,
  provider,
}: {
  api?: EthplorerApiType;
  apiKey?: string;
  signer?: Signer | JsonRpcSigner;
  provider: JsonRpcProvider | BrowserProvider;
}) => {
  const ethApi = api || ethplorerApi(apiKey);
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
    estimateTransactionFee: (txObject: EVMTxBaseParams, feeOptionKey?: FeeOption) =>
      estimateTransactionFee(txObject, feeOptionKey, chain, provider),
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({
        provider: overwriteProvider || provider,
        api: ethApi,
        address,
        chain,
        potentialScamFilter,
      }),
    multicall,
  };
};
