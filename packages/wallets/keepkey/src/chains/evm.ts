import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  type Chain,
  ChainToChainId,
  type DerivationPathArray,
  NetworkDerivationPath,
  derivationPathToString,
} from "@swapkit/helpers";
import type { JsonRpcProvider, Provider, TransactionRequest } from "ethers";
import { AbstractSigner } from "ethers";

import { bip32ToAddressNList } from "../helpers/coins";

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
    throw new Error("this method is not implemented");
  }

  getAddress = async () => {
    if (this.address) return this.address;
    const { address } = await this.sdk.address.ethereumGetAddress({
      address_n: bip32ToAddressNList(derivationPathToString(this.derivationPath)),
    });

    this.address = address;
    return address;
  };

  signMessage = (message: string) =>
    this.sdk.eth.ethSign({ address: this.address, message }) as Promise<string>;

  signTransaction = async ({
    to,
    value,
    gasLimit,
    nonce,
    data,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice,
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  }: TransactionRequest) => {
    if (!to) throw new Error("Missing to address");
    if (!gasLimit) throw new Error("Missing gasLimit");
    if (!data) throw new Error("Missing data");

    const isEIP1559 = !!((maxFeePerGas || maxPriorityFeePerGas) && !gasPrice);
    if (isEIP1559 && !maxFeePerGas) throw new Error("Missing maxFeePerGas");
    if (isEIP1559 && !maxPriorityFeePerGas) throw new Error("Missing maxFeePerGas");
    if (!(isEIP1559 || gasPrice)) throw new Error("Missing gasPrice");

    const { toHexString } = await import("@swapkit/toolbox-evm");

    const nonceValue = nonce
      ? BigInt(nonce)
      : BigInt(await this.provider.getTransactionCount(await this.getAddress(), "pending"));

    const input = {
      gas: toHexString(BigInt(gasLimit)),
      addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
      from: this.address,
      chainId: toHexString(BigInt(ChainToChainId[this.chain])),
      to: to.toString(),
      value: toHexString(BigInt(value || 0)),
      nonce: toHexString(nonceValue),
      data,
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
    if (!this.provider) throw new Error("No provider set");

    const signedTxHex = await this.signTransaction(tx);

    return await this.provider.broadcastTransaction(signedTxHex);
  };

  connect = (provider: Provider) =>
    new KeepKeySigner({
      sdk: this.sdk,
      chain: this.chain,
      derivationPath: this.derivationPath,
      provider,
    });
}
