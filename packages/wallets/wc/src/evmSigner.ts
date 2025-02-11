import { type EVMChain, SwapKitError, WalletOption } from "@swapkit/helpers";
import type { JsonRpcProvider, Provider, TransactionRequest } from "ethers";
import { AbstractSigner } from "ethers";

import { DEFAULT_EIP155_METHODS } from "./constants";
import { chainToChainId, getAddressByChain } from "./helpers";
import type { Walletconnect } from "./walletconnect";

interface WalletconnectEVMSignerParams {
  chain: EVMChain;
  walletconnect: Walletconnect;
  provider: Provider | JsonRpcProvider;
}

class WalletconnectSigner extends AbstractSigner {
  address: string;

  private chain: EVMChain;
  private walletconnect: Walletconnect;
  readonly provider: Provider | JsonRpcProvider;

  constructor({ chain, provider, walletconnect }: WalletconnectEVMSignerParams) {
    super(provider);
    this.chain = chain;
    this.walletconnect = walletconnect;
    this.provider = provider;
    this.address = "";
  }

  // biome-ignore lint/suspicious/useAwait: fulfil implementation type
  getAddress = async () => {
    if (!this.walletconnect) {
      throw new SwapKitError("wallet_walletconnect_connection_not_established");
    }
    if (!this.address) {
      this.address = getAddressByChain(this.chain, this.walletconnect.accounts);
    }

    return this.address;
  };

  signMessage = async (message: string) => {
    // this is probably broken
    const txHash = (await this.walletconnect?.client.request({
      chainId: chainToChainId(this.chain),
      topic: this.walletconnect.session.topic,
      request: {
        method: DEFAULT_EIP155_METHODS.ETH_SIGN,
        params: [message],
      },
    })) as string;

    return txHash.startsWith("0x") ? txHash : `0x${txHash}`;
  };

  signTransaction = () => {
    throw new Error("Not implemented: signTransaction");

    // const baseTx = {
    //   from,
    //   to,
    //   value: BigNumber.from(value || 0).toHexString(),
    //   data,
    // };

    // const txHash = (await this.walletconnect?.client.request({
    //   chainId: chainToChainId(this.chain),
    //   topic: this.walletconnect.session.topic,
    //   request: {
    //     method: DEFAULT_EIP155_METHODS.ETH_SIGN_TRANSACTION,
    //     params: [baseTx],
    //   },
    // })) as string;

    // return txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  };

  // ANCHOR (@Towan) - Implement in future
  signTypedData = () => {
    throw new Error("Not implemented: signTypedData");

    // const { toHexString } = await import('@swapkit/toolbox-evm');

    // const baseTx = {
    //   from,
    //   to,
    //   value: toHexString(value || 0n),
    //   data,
    // };

    // const txHash = (await this.walletconnect?.client.request({
    //   chainId: chainToChainId(this.chain),
    //   topic: this.walletconnect.session.topic,
    //   request: {
    //     method: DEFAULT_EIP155_METHODS.ETH_SIGN_TYPED_DATA,
    //     params: [baseTx],
    //   },
    // })) as string;

    // return txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  };

  // @ts-expect-error TODO: fix this
  sendTransaction = async ({ from, to, value, data }: TransactionRequest) => {
    const { toHexString } = await import("@swapkit/toolbox-evm");

    const baseTx = {
      from,
      to,
      value: toHexString(BigInt(value || 0)),
      data,
    };
    const response = await this.walletconnect?.client.request({
      chainId: chainToChainId(this.chain),
      topic: this.walletconnect.session.topic,
      request: {
        method: DEFAULT_EIP155_METHODS.ETH_SEND_TRANSACTION,
        params: [baseTx],
      },
    });

    return response;
  };

  // @ts-expect-error TODO: fix this
  connect = (provider: Provider | null) => {
    if (!provider) {
      throw new SwapKitError({
        errorKey: "wallet_provider_not_found",
        info: { wallet: WalletOption.WALLETCONNECT, chain: this.chain },
      });
    }

    return new WalletconnectSigner({
      chain: this.chain,
      walletconnect: this.walletconnect,
      provider,
    });
  };
}
export const getEVMSigner = async ({
  chain,
  walletconnect,
  provider,
}: WalletconnectEVMSignerParams) => new WalletconnectSigner({ chain, walletconnect, provider });
