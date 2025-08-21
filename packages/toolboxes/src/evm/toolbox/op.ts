import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  SKConfig,
  SwapKitError,
  getRPCUrl,
} from "@swapkit/helpers";
import type {
  Authorization,
  BrowserProvider,
  JsonRpcProvider,
  Provider,
  TransactionRequest,
} from "ethers";
import { Contract, HDNodeWallet } from "ethers";

import { P } from "ts-pattern";
import { match } from "ts-pattern";
import { getEvmApi } from "../api";
import { gasOracleAbi } from "../contracts/op/gasOracle";
import { getProvider } from "../helpers";
import type { EVMToolboxParams } from "../types";
import { BaseEVMToolbox } from "./baseEVMToolbox";

const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000f";

function connectGasPriceOracle<P extends Provider>(provider: P) {
  return new Contract(GAS_PRICE_ORACLE_ADDRESS, gasOracleAbi, provider);
}

export function getL1GasPriceFetcher<P extends Provider>(provider: P) {
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

    if (!to)
      throw new SwapKitError("toolbox_evm_invalid_transaction", { error: "Missing to address" });

    return Transaction.from({
      ...tx,
      authorizationList: tx.authorizationList as Authorization[],
      to: to as string,
      nonce: nonce ? nonce : from ? await provider.getTransactionCount(from) : 0,
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

export async function OPToolbox({
  provider: providerParam,
  ...toolboxSignerParams
}: EVMToolboxParams) {
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
    estimateL1Gas: estimateL1Gas(provider),
    estimateL1GasCost: estimateL1GasCost(provider),
    estimateL2GasCost: estimateL2GasCost(provider),
    estimateTotalGasCost: estimateTotalGasCost(provider),
    getBalance: getEvmApi(Chain.Optimism).getBalance,
    getL1GasPrice,
    getNetworkParams,
  };
}
