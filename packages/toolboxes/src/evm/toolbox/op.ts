import { applyFeeMultiplierToBigInt, Chain, FeeOption, getRPCUrl, SwapKitError } from "@swapkit/helpers";
import type { Authorization, BrowserProvider, JsonRpcProvider, Provider, TransactionRequest } from "ethers";
import { Contract, HDNodeWallet } from "ethers";
import { match, P } from "ts-pattern";
import { getEvmApi } from "../api";
import { gasOracleAbi } from "../contracts/op/gasOracle";
import { getProvider } from "../helpers";
import type { EVMToolboxParams } from "../types";
import { BaseEVMToolbox } from "./baseEVMToolbox";

const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000f";

function connectGasPriceOracle<P extends Provider>(provider: P) {
  return new Contract(GAS_PRICE_ORACLE_ADDRESS, gasOracleAbi, provider);
}

function getL1GasPriceFetcher<P extends Provider>(provider: P) {
  return async function getL1GasPrice() {
    const gasPriceOracle = connectGasPriceOracle(provider);

    if (gasPriceOracle && "l1BaseFee" in gasPriceOracle) {
      return (await gasPriceOracle?.l1BaseFee()) as unknown as bigint;
    }

    return undefined;
  };
}

function serializeTx<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function serializeTx({ from, to, nonce, ...tx }: TransactionRequest) {
    const { Transaction } = await import("ethers");

    if (!to) throw new SwapKitError("toolbox_evm_invalid_transaction", { error: "Missing to address" });

    return Transaction.from({
      ...tx,
      authorizationList: tx.authorizationList as Authorization[],
      nonce: nonce ? nonce : from ? await provider.getTransactionCount(from) : 0,
      to: to as string,
    }).serialized;
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

function estimateL1Gas<P extends JsonRpcProvider | BrowserProvider>(provider: P) {
  return async function estimateL1Gas(tx: TransactionRequest) {
    const gasPriceOracle = connectGasPriceOracle(provider);
    const serializedTx = await serializeTx(provider)(tx);

    if (gasPriceOracle && "getL1GasUsed" in gasPriceOracle) {
      return gasPriceOracle.getL1GasUsed(serializedTx);
    }
  };
}

async function estimateGasPrices(provider: Provider) {
  try {
    const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = await provider.getFeeData();
    const l1GasPrice = await getL1GasPriceFetcher(provider)();
    const price = gasPrice as bigint;

    if (!(maxFeePerGas && maxPriorityFeePerGas)) {
      throw new SwapKitError("toolbox_evm_no_fee_data");
    }

    return {
      [FeeOption.Average]: { gasPrice: price, l1GasPrice, maxFeePerGas, maxPriorityFeePerGas },
      [FeeOption.Fast]: {
        gasPrice: applyFeeMultiplierToBigInt(price, FeeOption.Fast),
        l1GasPrice: applyFeeMultiplierToBigInt(l1GasPrice || 0n, FeeOption.Fast),
        maxFeePerGas,
        maxPriorityFeePerGas: applyFeeMultiplierToBigInt(maxPriorityFeePerGas, FeeOption.Fast),
      },
      [FeeOption.Fastest]: {
        gasPrice: applyFeeMultiplierToBigInt(price, FeeOption.Fastest),
        l1GasPrice: applyFeeMultiplierToBigInt(l1GasPrice || 0n, FeeOption.Fastest),
        maxFeePerGas,
        maxPriorityFeePerGas: applyFeeMultiplierToBigInt(maxPriorityFeePerGas, FeeOption.Fastest),
      },
    } as {
      [key in FeeOption]: {
        l1GasPrice?: bigint;
        gasPrice?: bigint;
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
      };
    };
  } catch (error) {
    throw new SwapKitError("toolbox_evm_gas_estimation_error", {
      error: (error as any).msg ?? (error as any).toString(),
    });
  }
}

export async function OPToolbox({ provider: providerParam, ...toolboxSignerParams }: EVMToolboxParams) {
  const chain = Chain.Optimism;
  const rpcUrl = await getRPCUrl(chain);
  const provider = providerParam || (await getProvider(chain, rpcUrl));
  const signer = match(toolboxSignerParams)
    .with({ phrase: P.string }, ({ phrase }) => HDNodeWallet.fromPhrase(phrase).connect(provider))
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

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
  };
}
