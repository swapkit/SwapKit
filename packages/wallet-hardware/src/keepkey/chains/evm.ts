import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  type Chain,
  ChainId,
  type DerivationPathArray,
  derivationPathToString,
  NetworkDerivationPath,
  SwapKitError,
} from "@swapkit/helpers";
import type { JsonRpcProvider, Provider, TransactionRequest } from "ethers";
import { AbstractSigner } from "ethers";

import { bip32ToAddressNList } from "../coins";

interface KeepKeyEVMSignerParams {
  sdk: KeepKeySdk;
  chain: Chain;
  derivationPath?: DerivationPathArray;
  provider: Provider | JsonRpcProvider;
}

export class KeepKeySigner extends AbstractSigner {
  private sdk: KeepKeySdk;
  private chain: Chain;
  private derivationPath: DerivationPathArray;
  private address: string;
  readonly provider: Provider | JsonRpcProvider;

  constructor({ sdk, chain, derivationPath, provider }: KeepKeyEVMSignerParams) {
    super();
    this.sdk = sdk;
    this.chain = chain;
    this.derivationPath = derivationPath || NetworkDerivationPath.ETH;
    this.address = "";
    this.provider = provider;
  }

  signTypedData(): Promise<string> {
    throw new SwapKitError("wallet_keepkey_method_not_supported", { method: "signTypedData" });
  }

  getAddress = async () => {
    if (this.address) return this.address;
    const { address } = await this.sdk.address.ethereumGetAddress({
      address_n: bip32ToAddressNList(derivationPathToString(this.derivationPath)),
    });

    this.address = address;
    return address;
  };

  signMessage = (message: string) => this.sdk.eth.ethSign({ address: this.address, message }) as Promise<string>;

  signTransaction = async ({
    to,
    value,
    gasLimit,
    nonce,
    data,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice,
  }: TransactionRequest) => {
    if (!to) throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Missing to address" });
    if (!gasLimit) throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Missing gasLimit" });
    if (!data) throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Missing data" });

    const isEIP1559 = !!((maxFeePerGas || maxPriorityFeePerGas) && !gasPrice);
    if (isEIP1559 && !maxFeePerGas)
      throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Missing maxFeePerGas" });
    if (isEIP1559 && !maxPriorityFeePerGas)
      throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Missing maxPriorityFeePerGas" });
    if (!(isEIP1559 || gasPrice))
      throw new SwapKitError("wallet_keepkey_invalid_params", { reason: "Missing gasPrice" });

    const { toHexString } = await import("@swapkit/toolboxes/evm");

    const nonceValue = nonce
      ? BigInt(nonce)
      : BigInt(await this.provider.getTransactionCount(await this.getAddress(), "pending"));

    const input = {
      addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
      chainId: toHexString(BigInt(ChainId[this.chain])),
      data,
      from: this.address,
      gas: toHexString(BigInt(gasLimit)),
      nonce: toHexString(nonceValue),
      to: to.toString(),
      value: toHexString(BigInt(value || 0)),
      ...(isEIP1559 && {
        maxFeePerGas: toHexString(BigInt(maxFeePerGas?.toString() || "0")),
        maxPriorityFeePerGas: toHexString(BigInt(maxPriorityFeePerGas?.toString() || "0")),
      }),
      ...(!isEIP1559 && {
        // Fixed syntax error and structure here
        gasPrice: toHexString(BigInt(gasPrice?.toString() || "0")),
      }),
    };
    const responseSign = await this.sdk.eth.ethSignTransaction(input);
    return responseSign.serialized;
  };

  sendTransaction = async (tx: TransactionRequest): Promise<any> => {
    if (!this.provider) throw new SwapKitError("wallet_keepkey_no_provider");

    const signedTxHex = await this.signTransaction(tx);

    return await this.provider.broadcastTransaction(signedTxHex);
  };

  connect = (provider: Provider) =>
    new KeepKeySigner({ chain: this.chain, derivationPath: this.derivationPath, provider, sdk: this.sdk });
}
