import {
  type Asset,
  type AssetValue,
  Chain,
  ContractAddress,
  type EVMChain,
  FeeOption,
  SwapKitError,
  SwapKitNumber,
  type WalletTxParams,
  isGasAsset,
} from "@swapkit/helpers";
import { erc20ABI } from "@swapkit/helpers/contracts";
import {
  BrowserProvider,
  Contract,
  type ContractTransaction,
  type Fragment,
  type HDNodeWallet,
  Interface,
  type JsonFragment,
  type JsonRpcSigner,
  type Provider,
  type Signer,
  getAddress,
} from "ethers";

import {
  type ARBToolbox,
  type AVAXToolbox,
  type BASEToolbox,
  type BSCToolbox,
  type ETHToolbox,
  type MATICToolbox,
  type OPToolbox,
  toHexString,
} from "../index";
import type {
  ApproveParams,
  CallParams,
  EIP1559TxParams,
  EVMTxParams,
  EstimateCallParams,
  IsApprovedParams,
  LegacyEVMTxParams,
  TransferParams,
} from "../types";

export const MAX_APPROVAL = BigInt(
  "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

export function BaseEVMToolbox<
  P extends Provider | BrowserProvider,
  S extends Signer | JsonRpcSigner | HDNodeWallet | undefined,
>({
  provider,
  signer,
  isEIP1559Compatible = true,
}: { signer: S; provider: P; isEIP1559Compatible?: boolean }) {
  return {
    call: getCall({ provider, signer, isEIP1559Compatible }),
    estimateCall: getEstimateCall({ provider, signer }),
    EIP1193SendTransaction: getEIP1193SendTransaction(provider),
    approve: getApprove({ provider, signer, isEIP1559Compatible }),
    approvedAmount: getApprovedAmount({ provider }),
    broadcastTransaction: provider.broadcastTransaction,
    createApprovalTx: getCreateApprovalTx(provider),
    createContract: getCreateContract({ provider }),
    createContractTxObject: getCreateContractTxObject(provider),
    createTransferTx: getCreateTransferTx({ provider, signer }),
    estimateGasLimit: getEstimateGasLimit({ provider, signer }),
    estimateGasPrices: getEstimateGasPrices({ provider, isEIP1559Compatible }),
    isApproved: getIsApproved({ provider }),
    sendTransaction: getSendTransaction({ provider, signer, isEIP1559Compatible }),
    signMessage: signer?.signMessage,
    transfer: getTransfer({ provider, signer, isEIP1559Compatible }),
    validateAddress: (address: string) => evmValidateAddress({ address }),
  };
}

export function evmValidateAddress({ address }: { address: string }) {
  try {
    getAddress(address);
    return true;
  } catch (_error) {
    return false;
  }
}

export type EVMWallet = ReturnType<typeof BaseEVMToolbox>;
export type EVMWalletType = {
  [Chain.Arbitrum]: ReturnType<typeof ARBToolbox>;
  [Chain.Avalanche]: ReturnType<typeof AVAXToolbox>;
  [Chain.Base]: ReturnType<typeof BASEToolbox>;
  [Chain.BinanceSmartChain]: ReturnType<typeof BSCToolbox>;
  [Chain.Ethereum]: ReturnType<typeof ETHToolbox>;
  [Chain.Optimism]: ReturnType<typeof OPToolbox>;
  [Chain.Polygon]: ReturnType<typeof MATICToolbox>;
};

export type EVMWallets = {
  [chain in EVMChain]: EVMWallet & EVMWalletType[chain];
};

const baseAssetAddress: Record<EVMChain, string> = {
  [Chain.Arbitrum]: ContractAddress.ARB,
  [Chain.Avalanche]: ContractAddress.AVAX,
  [Chain.Base]: ContractAddress.BASE,
  [Chain.BinanceSmartChain]: ContractAddress.BSC,
  [Chain.Ethereum]: ContractAddress.ETH,
  [Chain.Optimism]: ContractAddress.OP,
  [Chain.Polygon]: ContractAddress.MATIC,
};

const stateMutable = ["payable", "nonpayable"];
// const nonStateMutable = ['view', 'pure'];

const isEIP1559Transaction = (tx: EVMTxParams) =>
  (tx as EIP1559TxParams).type === 2 ||
  !!(tx as EIP1559TxParams).maxFeePerGas ||
  !!(tx as EIP1559TxParams).maxPriorityFeePerGas;

type ToolboxWrapParams<P = Provider | BrowserProvider, T = {}> = T & {
  isEIP1559Compatible?: boolean;
  provider: P;
  signer?: Signer;
};

export function isBrowserProvider(provider: any) {
  return provider instanceof BrowserProvider;
}

export function createContract(
  address: string,
  abi: readonly (JsonFragment | Fragment)[],
  provider: Provider,
) {
  return new Contract(address, Interface.from(abi), provider);
}

export function getCreateContract({ provider }: ToolboxWrapParams) {
  return function createContract(address: string, abi: readonly (JsonFragment | Fragment)[]) {
    return new Contract(address, Interface.from(abi), provider);
  };
}

export function isStateChangingCall({
  abi,
  funcName,
}: { abi: readonly JsonFragment[]; funcName: string }) {
  const abiFragment = abi.find((fragment: any) => fragment.name === funcName) as any;
  if (!abiFragment) throw new SwapKitError("toolbox_evm_no_abi_fragment", { funcName });
  return abiFragment.stateMutability && stateMutable.includes(abiFragment.stateMutability);
}

function getCall({ provider, isEIP1559Compatible, signer }: ToolboxWrapParams) {
  /**
   * @info call contract function
   * When using this method to make a non state changing call to the blockchain, like a isApproved call,
   * the signer needs to be set to undefined
   */
  return async function call<T>({
    callProvider,
    contractAddress,
    abi,
    funcName,
    funcParams = [],
    txOverrides = {},
    feeOption = FeeOption.Fast,
  }: CallParams): Promise<T> {
    const contractProvider = callProvider || provider;
    if (!contractAddress) throw new Error("contractAddress must be provided");

    const isStateChanging = isStateChangingCall({ abi, funcName });

    if (isStateChanging && isBrowserProvider(contractProvider) && signer) {
      const createTx = getCreateContractTxObject({ provider: contractProvider });
      const from = txOverrides?.from || (await signer?.getAddress());
      const txObject = await createTx({
        contractAddress,
        abi,
        funcName,
        funcParams,
        txOverrides: { ...txOverrides, from },
      });
      const sendTx = getEIP1193SendTransaction(contractProvider);

      return sendTx(txObject) as Promise<T>;
    }
    const contract = createContract(contractAddress, abi, contractProvider);

    // only use signer if the contract function is state changing
    if (isStateChanging) {
      if (!signer) throw new SwapKitError("toolbox_evm_no_signer");

      const from = txOverrides?.from || (await signer.getAddress());
      if (!from) throw new SwapKitError("toolbox_evm_no_signer_address");

      const connectedContract = contract.connect(signer);
      const estimateGasPrices = getEstimateGasPrices({ provider, isEIP1559Compatible });
      const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = (await estimateGasPrices())[
        feeOption
      ];

      const gasLimit = await contract.getFunction(funcName).estimateGas(...funcParams, txOverrides);

      // @ts-expect-error
      const result = await connectedContract[funcName](...funcParams, {
        ...txOverrides,
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasPrice,
        /**
         * nonce must be set due to a possible bug with ethers.js,
         * expecting a synchronous nonce while the JsonRpcProvider delivers Promise
         */
        nonce: txOverrides?.nonce || (await contractProvider.getTransactionCount(from)),
      });

      return typeof result?.hash === "string" ? result?.hash : result;
    }

    const result = await contract[funcName]?.(...funcParams);

    return typeof result?.hash === "string" ? result?.hash : result;
  };
}

export function getCreateContractTxObject({ provider }: ToolboxWrapParams) {
  return async ({ contractAddress, abi, funcName, funcParams = [], txOverrides }: CallParams) =>
    createContract(contractAddress, abi, provider)
      .getFunction(funcName)
      .populateTransaction(
        ...funcParams.concat(txOverrides).filter((p) => typeof p !== "undefined"),
      );
}

function getApprovedAmount({ provider }: ToolboxWrapParams) {
  return function approveAmount({ assetAddress, spenderAddress, from }: IsApprovedParams) {
    const call = getCall({ provider, isEIP1559Compatible: true });

    return call<bigint>({
      contractAddress: assetAddress,
      abi: erc20ABI,
      funcName: "allowance",
      funcParams: [from, spenderAddress],
    });
  };
}

function getIsApproved({ provider }: ToolboxWrapParams) {
  return async function isApproved({
    assetAddress,
    spenderAddress,
    from,
    amount = MAX_APPROVAL,
  }: IsApprovedParams) {
    const approvedAmount = await getApprovedAmount({ provider })({
      assetAddress,
      spenderAddress,
      from,
    });

    return SwapKitNumber.fromBigInt(approvedAmount).gte(SwapKitNumber.fromBigInt(BigInt(amount)));
  };
}

function getApprove({ signer, isEIP1559Compatible = true, provider }: ToolboxWrapParams) {
  return async function approve({
    assetAddress,
    spenderAddress,
    feeOptionKey = FeeOption.Fast,
    amount,
    gasLimitFallback,
    from,
    nonce,
  }: ApproveParams) {
    const funcParams = [spenderAddress, BigInt(amount || MAX_APPROVAL)];

    const functionCallParams = {
      contractAddress: assetAddress,
      abi: erc20ABI,
      funcName: "approve",
      funcParams,
      signer,
      txOverrides: { from },
    };

    if (isBrowserProvider(provider)) {
      const createTx = getCreateContractTxObject(provider);
      const sendTx = getEIP1193SendTransaction(provider);
      const txObject = await createTx(functionCallParams);

      return sendTx(txObject);
    }

    const call = getCall({ provider, isEIP1559Compatible });

    return call<string>({
      ...functionCallParams,
      funcParams,
      txOverrides: {
        from,
        nonce,
        gasLimit: gasLimitFallback ? BigInt(gasLimitFallback.toString()) : undefined,
      },
      feeOption: feeOptionKey,
    });
  };
}

function getTransfer({ signer, isEIP1559Compatible = true, provider }: ToolboxWrapParams) {
  return async function transfer({
    assetValue,
    memo,
    recipient,
    feeOptionKey = FeeOption.Fast,
    data,
    from: fromOverride,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice,
    ...tx
  }: TransferParams) {
    const { hexlify, toUtf8Bytes } = await import("ethers");
    const txAmount = assetValue.getBaseValue("bigint");
    const chain = assetValue.chain as EVMChain;
    const from = fromOverride || (await signer?.getAddress());

    if (!from) throw new SwapKitError("toolbox_evm_no_from_address");

    if (assetValue.isGasAsset) {
      const sendTx = getSendTransaction({ provider, signer, isEIP1559Compatible });
      const txObject = {
        ...tx,
        from,
        to: recipient,
        value: txAmount,
        data: data || hexlify(toUtf8Bytes(memo || "")),
        feeOptionKey,
      };

      return sendTx(txObject);
    }

    const call = getCall({ signer, provider, isEIP1559Compatible });
    const contractAddress = getTokenAddress(assetValue, chain);
    if (!contractAddress) throw new SwapKitError("toolbox_evm_no_contract_address");

    return call<string>({
      contractAddress,
      abi: erc20ABI,
      funcName: "transfer",
      funcParams: [recipient, txAmount],
      txOverrides: { from, maxFeePerGas, maxPriorityFeePerGas, gasPrice },
      feeOption: feeOptionKey,
    });
  };
}

export function getEstimateGasPrices({
  provider,
  isEIP1559Compatible = true,
}: { provider: Provider; isEIP1559Compatible?: boolean }) {
  return async function estimateGasPrices() {
    try {
      const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = await provider.getFeeData();

      if (isEIP1559Compatible) {
        if (maxFeePerGas === null || maxPriorityFeePerGas === null)
          throw new SwapKitError("toolbox_evm_no_fee_data");

        return {
          [FeeOption.Average]: { maxFeePerGas, maxPriorityFeePerGas },
          [FeeOption.Fast]: {
            maxFeePerGas: (maxFeePerGas * 15n) / 10n,
            maxPriorityFeePerGas: (maxPriorityFeePerGas * 15n) / 10n,
          },
          [FeeOption.Fastest]: {
            maxFeePerGas: maxFeePerGas * 2n,
            maxPriorityFeePerGas: maxPriorityFeePerGas * 2n,
          },
        };
      }
      if (!gasPrice) throw new SwapKitError("toolbox_evm_no_gas_price");

      return {
        [FeeOption.Average]: { gasPrice },
        [FeeOption.Fast]: { gasPrice: (gasPrice * 15n) / 10n },
        [FeeOption.Fastest]: { gasPrice: gasPrice * 2n },
      };
    } catch (error) {
      throw new Error(
        `Failed to estimate gas price: ${(error as any).msg ?? (error as any).toString()}`,
      );
    }
  };
}

function getEstimateCall({ provider, signer }: { signer?: Signer; provider: Provider }) {
  return function estimateCall({
    contractAddress,
    abi,
    funcName,
    funcParams = [],
    txOverrides,
  }: EstimateCallParams) {
    if (!contractAddress) throw new SwapKitError("toolbox_evm_no_contract_address");

    const contract = createContract(contractAddress, abi, provider);
    return signer
      ? contract
          .connect(signer)
          .getFunction(funcName)
          .estimateGas(...funcParams, txOverrides)
      : contract.getFunction(funcName).estimateGas(...funcParams, txOverrides);
  };
}

function getEstimateGasLimit({ provider, signer }: ToolboxWrapParams) {
  return async function estimateGasLimit({
    assetValue,
    recipient,
    memo,
    from,
    funcName,
    funcParams,
    txOverrides,
  }: WalletTxParams & {
    assetValue: AssetValue;
    funcName?: string;
    funcParams?: unknown[];
    txOverrides?: EVMTxParams;
  }) {
    // const value = assetValue.getBaseValue("bigint");
    const value = assetValue.bigIntValue;

    const assetAddress = assetValue.isGasAsset
      ? null
      : getTokenAddress(assetValue, assetValue.chain as EVMChain);

    if (assetAddress && funcName) {
      const estimateCall = getEstimateCall({ provider, signer });
      // ERC20 gas estimate
      return estimateCall({
        contractAddress: assetAddress,
        abi: erc20ABI,
        funcName,
        funcParams,
        txOverrides,
      });
    }

    const { hexlify, toUtf8Bytes } = await import("ethers");

    return provider.estimateGas({
      from,
      to: recipient,
      value,
      data: memo ? hexlify(toUtf8Bytes(memo)) : undefined,
    });
  };
}

function getSendTransaction({ provider, signer, isEIP1559Compatible = true }: ToolboxWrapParams) {
  return async function sendTransaction({
    feeOptionKey = FeeOption.Fast,
    ...tx
  }: EVMTxParams & { feeOptionKey?: FeeOption }) {
    const { from, to, data, value, ...transaction } = tx;

    if (!signer) throw new SwapKitError("toolbox_evm_no_signer");
    if (!to) throw new SwapKitError("toolbox_evm_no_to_address");

    const parsedTxObject = {
      ...transaction,
      data: data || "0x",
      to,
      from,
      value: BigInt(value || 0),
    };

    // early return to skip gas estimation if provider is EIP-1193
    if (isBrowserProvider(provider)) {
      const sendTx = getEIP1193SendTransaction(provider);
      return sendTx(parsedTxObject);
    }

    const address = from || (await signer.getAddress());
    const nonce = tx.nonce || (await provider.getTransactionCount(address));
    const chainId = (await provider.getNetwork()).chainId;

    const isEIP1559 = isEIP1559Transaction(parsedTxObject) || isEIP1559Compatible;
    const estimateGasPrices = getEstimateGasPrices({ provider, isEIP1559Compatible });

    const feeData =
      (isEIP1559 &&
        !(
          (parsedTxObject as EIP1559TxParams).maxFeePerGas &&
          (parsedTxObject as EIP1559TxParams).maxPriorityFeePerGas
        )) ||
      !(parsedTxObject as LegacyEVMTxParams).gasPrice
        ? Object.entries((await estimateGasPrices())[feeOptionKey]).reduce(
            // biome-ignore lint/performance/noAccumulatingSpread: this is a small object
            (acc, [k, v]) => ({ ...acc, [k]: toHexString(BigInt(v)) }),
            {} as {
              maxFeePerGas?: string;
              maxPriorityFeePerGas?: string;
              gasPrice?: string;
            },
          )
        : {};
    let gasLimit: string;
    try {
      gasLimit = toHexString(
        parsedTxObject.gasLimit || ((await provider.estimateGas(parsedTxObject)) * 11n) / 10n,
      );
    } catch (error) {
      throw new SwapKitError("toolbox_evm_error_estimating_gas_limit", { error });
    }

    try {
      const txObject = {
        ...parsedTxObject,
        chainId,
        type: isEIP1559 ? 2 : 0,
        gasLimit,
        nonce,
        ...feeData,
      };

      try {
        const response = await signer.sendTransaction(txObject);
        return response.hash;
      } catch (_error) {
        const txHex = await signer.signTransaction({
          ...txObject,
          from: address,
        });
        const response = await provider.broadcastTransaction(txHex);
        return response.hash;
      }
    } catch (error) {
      throw new SwapKitError("toolbox_evm_error_sending_transaction", { error });
    }
  };
}

/**
 * Exported helper functions
 */
export function toChecksumAddress(address: string) {
  return getAddress(address);
}

export function getEIP1193SendTransaction(provider: Provider | BrowserProvider) {
  return function EIP1193SendTransaction({
    value,
    ...params
  }: EVMTxParams | ContractTransaction): Promise<string> {
    if (!isBrowserProvider(provider)) {
      throw new SwapKitError("toolbox_evm_provider_not_eip1193_compatible");
    }

    return (provider as BrowserProvider).send("eth_sendTransaction", [
      { value: toHexString(BigInt(value || 0)), ...params } as any,
    ]);
  };
}

export function getChecksumAddressFromAsset(asset: Asset, chain: EVMChain) {
  const assetAddress = getTokenAddress(asset, chain);

  if (assetAddress) {
    return getAddress(assetAddress.toLowerCase());
  }

  throw new SwapKitError("toolbox_evm_invalid_gas_asset_address");
}

export function getTokenAddress({ chain, symbol, ticker }: Asset, baseAssetChain: EVMChain) {
  try {
    const isBSCBNB = chain === Chain.BinanceSmartChain && symbol === "BNB" && ticker === "BNB";
    const isBaseAsset =
      chain === baseAssetChain && symbol === baseAssetChain && ticker === baseAssetChain;
    const isEVMAsset =
      [Chain.Arbitrum, Chain.Base].includes(chain) && symbol === "ETH" && ticker === "ETH";

    if (isBaseAsset || isBSCBNB || isEVMAsset) {
      return baseAssetAddress[baseAssetChain];
    }

    // strip 0X only - 0x is still valid
    return getAddress(symbol.slice(ticker.length + 1).replace(/^0X/, ""));
  } catch (_error) {
    return null;
  }
}

function getCreateTransferTx({
  provider,
  signer,
}: { provider: Provider | BrowserProvider; signer?: Signer }) {
  return async function createTransferTx({
    assetValue,
    memo,
    recipient,
    feeOptionKey = FeeOption.Fast,
    data,
    from: fromOverride,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice,
    ...tx
  }: TransferParams) {
    const txAmount = assetValue.getBaseValue("bigint");
    const chain = assetValue.chain as EVMChain;
    const from = fromOverride || (await signer?.getAddress());

    if (!from) throw new SwapKitError("toolbox_evm_no_from_address");

    if (isGasAsset(assetValue)) {
      const { hexlify, toUtf8Bytes } = await import("ethers");

      return {
        ...tx,
        from,
        to: recipient,
        value: txAmount,
        data: data || hexlify(toUtf8Bytes(memo || "")),
      };
    }

    const contractAddress = getTokenAddress(assetValue, chain);
    if (!contractAddress) throw new SwapKitError("toolbox_evm_no_contract_address");
    const createTx = getCreateContractTxObject(provider);

    return createTx({
      contractAddress,
      abi: erc20ABI,
      funcName: "transfer",
      funcParams: [recipient, txAmount],
      txOverrides: { from, maxFeePerGas, maxPriorityFeePerGas, gasPrice },
    });
  };
}

function getCreateApprovalTx(provider: Provider) {
  return async function createApprovalTx({
    assetAddress,
    spenderAddress,
    amount,
    from,
  }: ApproveParams) {
    const createTx = getCreateContractTxObject(provider);
    const funcParams = [spenderAddress, BigInt(amount || MAX_APPROVAL)];

    const txObject = await createTx({
      contractAddress: assetAddress,
      abi: erc20ABI,
      funcName: "approve",
      funcParams,
      txOverrides: { from },
    });

    return txObject;
  };
}
