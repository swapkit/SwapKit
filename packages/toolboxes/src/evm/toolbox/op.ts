import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  FeeOption,
  SKConfig,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer, TransactionRequest } from "ethers";
import { Contract } from "ethers";

import { getEvmApi } from "../api";
import { gasOracleAbi } from "../contracts/op/gasOracle";
import { BaseEVMToolbox } from "./baseEVMToolbox";

const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000f";

function connectGasPriceOracle<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return new Contract(GAS_PRICE_ORACLE_ADDRESS, gasOracleAbi, provider);
}

function getL1GasPriceFetcher<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return function getL1GasPrice() {
    const gasPriceOracle = connectGasPriceOracle(provider);

    if (gasPriceOracle && "l1BaseFee" in gasPriceOracle) {
      return gasPriceOracle?.l1BaseFee() as unknown as bigint;
    }

    return undefined;
  };
}

function serializeTx<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function serializeTx({ from, to, nonce, ...tx }: TransactionRequest) {
    const { Transaction } = await import("ethers");

    if (!to) throw new Error("Missing to address");
    const txParams = {
      ...tx,
      to: to as string,
      nonce: nonce ? nonce : from ? await provider.getTransactionCount(from) : 0,
    };

    return Transaction.from(txParams).serialized;
  };
}

function estimateL1GasCost<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function estimateL1GasCost(tx: TransactionRequest) {
    const gasPriceOracle = connectGasPriceOracle(provider);
    const serializedTx = await serializeTx(provider)(tx);

    if (gasPriceOracle && "getL1Fee" in gasPriceOracle) {
      return gasPriceOracle.getL1Fee(serializedTx);
    }
  };
}

function estimateL2GasCost<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function estimateL2GasCost(tx: TransactionRequest) {
    const l2GasPrice = await provider.send("eth_gasPrice", []);
    const l2GasCost = await provider.estimateGas(tx);
    return l2GasPrice.mul(l2GasCost);
  };
}

function estimateTotalGasCost<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function estimateTotalGasCost(tx: TransactionRequest) {
    const l1GasCost = await estimateL1GasCost(provider)(tx);
    const l2GasCost = await estimateL2GasCost(provider)(tx);
    return l1GasCost.add(l2GasCost);
  };
}

export function estimateL1Gas<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function estimateL1Gas(tx: TransactionRequest) {
    const gasPriceOracle = connectGasPriceOracle(provider);
    const serializedTx = await serializeTx(provider)(tx);

    if (gasPriceOracle && "getL1GasUsed" in gasPriceOracle) {
      return gasPriceOracle.getL1GasUsed(serializedTx);
    }
  };
}

const getNetworkParams = () => ({
  chainId: ChainId.OptimismHex,
  chainName: "Optimism",
  nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals: BaseDecimal.ETH },
  rpcUrls: [SKConfig.get("rpcUrls")[Chain.Optimism]],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Optimism]],
});

function estimateGasPrices<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function estimateGasPrices() {
    try {
      const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = await provider.getFeeData();
      const l1GasPrice = getL1GasPriceFetcher(provider)();
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
}

export function OPToolbox<P extends JsonRpcProvider | BrowserProvider, S extends Signer>({
  provider,
  signer,
}: { signer?: S; provider: P }) {
  const evmToolbox = BaseEVMToolbox({ provider, signer });
  const getL1GasPrice = getL1GasPriceFetcher(provider);

  return {
    ...evmToolbox,
    estimateGasPrices: estimateGasPrices(provider),
    estimateL1Gas: estimateL1Gas(provider),
    estimateL1GasCost: estimateL1GasCost(provider),
    estimateL2GasCost: estimateL2GasCost(provider),
    estimateTotalGasCost: estimateTotalGasCost(provider),
    getBalance: getEvmApi(Chain.Optimism).getBalance,
    getL1GasPrice,
    getNetworkParams,
  };
}
