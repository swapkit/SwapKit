import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  FeeOption,
  getRPCUrl,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer, TransactionRequest } from "ethers";
import { Contract, Transaction } from "ethers";

import type { CovalentApiType } from "../api/covalentApi";
import { covalentApi } from "../api/covalentApi";
import { gasOracleAbi } from "../contracts/op/gasOracle";
import { getBalance } from "../index";

import { EVMToolbox } from "./EVMToolbox";

const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000f";

export const connectGasPriceOracle = (provider: JsonRpcProvider | BrowserProvider) => {
  return new Contract(GAS_PRICE_ORACLE_ADDRESS, gasOracleAbi, provider);
};

export const getL1GasPrice = (provider: JsonRpcProvider | BrowserProvider) => {
  const gasPriceOracle = connectGasPriceOracle(provider);

  if (gasPriceOracle && "l1BaseFee" in gasPriceOracle) {
    return gasPriceOracle?.l1BaseFee() as unknown as bigint;
  }

  return undefined;
};

const _serializeTx = async (
  provider: JsonRpcProvider | BrowserProvider,
  { data, from, to, gasPrice, type, gasLimit, nonce }: TransactionRequest,
) => {
  if (!to) throw new Error("Missing to address");

  return Transaction.from({
    data,
    to: to as string,
    gasPrice,
    type,
    gasLimit,
    nonce: nonce ? nonce : from ? await provider.getTransactionCount(from) : 0,
  }).serialized;
};

export const estimateL1GasCost = async (
  provider: JsonRpcProvider | BrowserProvider,
  tx: TransactionRequest,
) => {
  const gasPriceOracle = await connectGasPriceOracle(provider);
  const serializedTx = await _serializeTx(provider, tx);

  if (gasPriceOracle && "getL1Fee" in gasPriceOracle) {
    return gasPriceOracle.getL1Fee(serializedTx);
  }
};

export const estimateL2GasCost = async (
  provider: JsonRpcProvider | BrowserProvider,
  tx: TransactionRequest,
) => {
  const l2GasPrice = await provider.send("eth_gasPrice", []);
  const l2GasCost = await provider.estimateGas(tx);
  return l2GasPrice.mul(l2GasCost);
};

export const estimateTotalGasCost = async (
  provider: JsonRpcProvider | BrowserProvider,
  tx: TransactionRequest,
) => {
  const l1GasCost = await estimateL1GasCost(provider, tx);
  const l2GasCost = await estimateL2GasCost(provider, tx);
  return l1GasCost.add(l2GasCost);
};

export const estimateL1Gas = async (
  provider: JsonRpcProvider | BrowserProvider,
  tx: TransactionRequest,
) => {
  const gasPriceOracle = connectGasPriceOracle(provider);
  const serializedTx = await _serializeTx(provider, tx);

  if (gasPriceOracle && "getL1GasUsed" in gasPriceOracle) {
    return gasPriceOracle.getL1GasUsed(serializedTx);
  }
};

const getNetworkParams = () => ({
  chainId: ChainId.OptimismHex,
  chainName: "Optimism",
  nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals: BaseDecimal.ETH },
  rpcUrls: [getRPCUrl(Chain.Optimism)],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Optimism]],
});

const estimateGasPrices = async (provider: JsonRpcProvider | BrowserProvider) => {
  try {
    const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = await provider.getFeeData();
    const l1GasPrice = await getL1GasPrice(provider);
    const price = gasPrice as bigint;

    if (!(maxFeePerGas && maxPriorityFeePerGas)) {
      throw new Error("No fee data available");
    }

    return {
      [FeeOption.Average]: {
        l1GasPrice,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
      [FeeOption.Fast]: {
        l1GasPrice: ((l1GasPrice || 0n) * 15n) / 10n,
        gasPrice: (price * 15n) / 10n,
        maxFeePerGas,
        maxPriorityFeePerGas: (maxPriorityFeePerGas * 15n) / 10n,
      },
      [FeeOption.Fastest]: {
        l1GasPrice: (l1GasPrice || 0n) * 2n,
        gasPrice: price * 2n,
        maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas * 2n,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to estimate gas price: ${(error as any).msg ?? (error as any).toString()}`,
    );
  }
};

export const OPToolbox = ({
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
  const opApi = api || covalentApi({ apiKey: covalentApiKey, chainId: ChainId.Optimism });
  const evmToolbox = EVMToolbox({ provider, signer });

  return {
    ...evmToolbox,
    estimateTotalGasCost: (tx: TransactionRequest) => estimateTotalGasCost(provider, tx),
    estimateL1GasCost: (tx: TransactionRequest) => estimateL1GasCost(provider, tx),
    estimateL2GasCost: (tx: TransactionRequest) => estimateL2GasCost(provider, tx),
    getL1GasPrice: () => getL1GasPrice(provider),
    estimateL1Gas: (tx: TransactionRequest) => estimateL1Gas(provider, tx),
    getNetworkParams,
    estimateGasPrices: () => estimateGasPrices(provider),
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({
        provider: overwriteProvider || provider,
        api: opApi,
        address,
        chain: Chain.Optimism,
        potentialScamFilter,
      }),
  };
};
