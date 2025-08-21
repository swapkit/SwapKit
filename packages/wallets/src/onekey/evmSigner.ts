import type { Chain, DerivationPathArray } from "@swapkit/helpers";
import { SwapKitError, WalletOption } from "@swapkit/helpers";
import type { JsonRpcProvider, Provider, Signer, TypedDataDomain, TypedDataField } from "ethers";

type OneKeyEVMSignerParams = {
  chain: Chain;
  derivationPath: DerivationPathArray;
  provider: Provider | JsonRpcProvider;
};

export async function getEVMSigner({ chain, derivationPath, provider }: OneKeyEVMSignerParams) {
  const { AbstractSigner, BrowserProvider } = await import("ethers");

  class OneKeySigner extends AbstractSigner {
    address: string;
    chain: Chain;
    derivationPath: DerivationPathArray;
    readonly provider: Provider | JsonRpcProvider;

    constructor({ chain, derivationPath, provider }: OneKeyEVMSignerParams) {
      super(provider);

      this.address = "";
      this.chain = chain;
      this.derivationPath = derivationPath;
      this.provider = provider;
    }

    connect(provider: null | Provider): Signer {
      if (!provider) {
        throw new SwapKitError({
          errorKey: "wallet_provider_not_found",
          info: { chain: this.chain, wallet: WalletOption.ONEKEY },
        });
      }

      return new OneKeySigner({ chain: this.chain, derivationPath: this.derivationPath, provider });
    }

    signTypedData(
      domain: TypedDataDomain,
      types: Record<string, TypedDataField[]>,
      value: Record<string, any>,
    ): Promise<string> {
      if (!window.$onekey?.ethereum) {
        throw new SwapKitError({ errorKey: "wallet_onekey_not_found", info: { chain: this.chain } });
      }

      return this.getAddress().then(async (_address) => {
        try {
          const signer = await new BrowserProvider(window.$onekey.ethereum).getSigner();
          return signer.signTypedData(domain, types, value);
        } catch (error) {
          throw new SwapKitError({
            errorKey: "core_wallet_sign_message_not_supported",
            info: { error, wallet: WalletOption.ONEKEY },
          });
        }
      });
    }

    getAddress = async () => {
      if (this.address) return this.address;

      if (!window.$onekey?.ethereum) {
        throw new SwapKitError({ errorKey: "wallet_onekey_not_found", info: { chain: this.chain } });
      }

      const signer = await new BrowserProvider(window.$onekey.ethereum).getSigner();
      this.address = await signer.getAddress();
      return this.address;
    };

    signMessage = async (message: string) => {
      if (!window.$onekey?.ethereum) {
        throw new SwapKitError({ errorKey: "wallet_onekey_not_found", info: { chain: this.chain } });
      }

      const signer = await new BrowserProvider(window.$onekey.ethereum).getSigner();
      return signer.signMessage(message);
    };

    signTransaction = async (transaction: any) => {
      if (!window.$onekey?.ethereum) {
        throw new SwapKitError({ errorKey: "wallet_onekey_not_found", info: { chain: this.chain } });
      }

      const signer = await new BrowserProvider(window.$onekey.ethereum).getSigner();
      const { to, value, gasLimit, gasPrice, data, maxFeePerGas, maxPriorityFeePerGas } = transaction;

      if (!to) throw new SwapKitError("toolbox_evm_no_to_address");
      if (!gasLimit) throw new SwapKitError("toolbox_evm_no_gas_price");

      const tx: any = { data, gasLimit, to };

      if (value) {
        tx.value = value;
      }

      if (maxFeePerGas && maxPriorityFeePerGas) {
        tx.maxFeePerGas = maxFeePerGas;
        tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
      } else if (gasPrice) {
        tx.gasPrice = gasPrice;
      }

      return signer.signTransaction(tx);
    };
  }

  return new OneKeySigner({ chain, derivationPath, provider });
}
