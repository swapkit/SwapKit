import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  FeeOption,
  getRPCUrl,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Provider, Signer } from "ethers";

import type { CovalentApiType } from "../api/covalentApi";
import { covalentApi } from "../api/covalentApi";
import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";

import { EVMToolbox } from "./EVMToolbox";

const getNetworkParams = () => ({
  chainId: ChainId.ArbitrumHex,
  chainName: "Arbitrum One",
  nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals: BaseDecimal.ETH },
  rpcUrls: [getRPCUrl(Chain.Arbitrum)],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Arbitrum]],
});

const estimateGasPrices = async (provider: Provider) => {
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
};

export const ARBToolbox = ({
  api,
  provider,
  signer,
  covalentApiKey,
}: {
  api?: CovalentApiType;
  covalentApiKey: string;
  signer?: Signer;
  provider: JsonRpcProvider | BrowserProvider;
}) => {
  const arbApi = api || covalentApi({ apiKey: covalentApiKey, chainId: ChainId.Arbitrum });
  const evmToolbox = EVMToolbox({ provider, signer, isEIP1559Compatible: false });
  const chain = Chain.Arbitrum;

  return {
    ...evmToolbox,
    getNetworkParams,
    estimateGasPrices: () => estimateGasPrices(provider),
    estimateTransactionFee: (txObject: EVMTxBaseParams) =>
      estimateTransactionFee(txObject, FeeOption.Average, chain, provider, false),
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({
        provider: overwriteProvider || provider,
        api: arbApi,
        address,
        chain,
        potentialScamFilter,
      }),
  };
};
