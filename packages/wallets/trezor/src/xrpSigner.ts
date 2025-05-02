import {
  Chain,
  type DerivationPathArray,
  NetworkDerivationPath,
  SwapKitError,
  derivationPathToString,
} from "@swapkit/helpers";
import { type AsyncXrpSigner, type Payment, hashes } from "@swapkit/toolbox-ripple";

export async function getXrpSigner({
  derivationPath = NetworkDerivationPath.XRP,
}: { derivationPath?: DerivationPathArray }): Promise<AsyncXrpSigner> {
  const { default: TrezorConnect } = await import("@trezor/connect-web");

  async function getAddress() {
    const result = await TrezorConnect.rippleGetAddress({
      path: derivationPathToString(derivationPath),
    });

    if (!result.success) {
      throw new SwapKitError({
        errorKey: "wallet_trezor_failed_to_get_address",
        info: {
          ...result,
          chain: Chain.Ripple,
          derivationPath: derivationPathToString(derivationPath),
        },
      });
    }

    return result.payload.address;
  }

  const address = await getAddress();

  async function sign(tx: Payment) {
    const fee = tx.Fee ? tx.Fee :;
    const flags = tx.Flags as number;
    const sequence = tx.Sequence as number;

    const result = await TrezorConnect.rippleSignTransaction({
      path: derivationPathToString(derivationPath),
      transaction: {
        fee,
        flags,
        sequence,
        payment: {
          amount: typeof tx.Amount === "string" ? tx.Amount : tx.Amount.value,
          destination: tx.,
        },
      },
    });

    if (!result.success) {
      throw new SwapKitError({
        errorKey: "wallet_trezor_failed_to_sign_transaction",
        info: { ...result, tx },
      });
    }

    const signedTxBlob = result.payload.serializedTx;

    return {
      tx_blob: signedTxBlob,
      hash: hashes.hashSignedTx(signedTxBlob),
    };
  }
  //         const result = await TrezorConnect.ethereumGetAddress({
  //           path: derivationPathToString(this.derivationPath),
  //           showOnTrezor: true,
  //         });

  //         if (!result.success) {
  //           throw new SwapKitError({
  //             errorKey: "wallet_trezor_failed_to_get_address",
  //             info: { ...result, chain: this.chain, derivationPath: this.derivationPath },
  //           });
  //         }

  //         this.address = result.payload.address;

  //   const TrezorSigner;
  //   extends AsyncXrpSigner
  //   {
  //     address: string;
  //     chain: Chain;
  //     derivationPath: DerivationPathArray;
  //     readonly;
  //     provider: Provider | JsonRpcProvider;

  //     constructor({ chain, derivationPath, provider }: TrezorEVMSignerParams)
  //     {
  //       super(provider);

  //       this.address = "";
  //       this.chain = chain;
  //       this.derivationPath = derivationPath;
  //       this.provider = provider;
  //     }

  //     getAddress = async () => {
  //       if (!this.address) {
  //         const { default: TrezorConnect } = await import("@trezor/connect-web");

  //         const result = await TrezorConnect.ethereumGetAddress({
  //           path: derivationPathToString(this.derivationPath),
  //           showOnTrezor: true,
  //         });

  //         if (!result.success) {
  //           throw new SwapKitError({
  //             errorKey: "wallet_trezor_failed_to_get_address",
  //             info: { ...result, chain: this.chain, derivationPath: this.derivationPath },
  //           });
  //         }

  //         this.address = result.payload.address;
  //       }

  //       return this.address;
  //     };

  //     signMessage = async (message: string) => {
  //       const { default: TrezorConnect } = await import("@trezor/connect-web");

  //       const result = await TrezorConnect.ethereumSignMessage({
  //         path: derivationPathToString(this.derivationPath),
  //         message,
  //       });

  //       if (!result.success) {
  //         throw new SwapKitError({
  //           errorKey: "wallet_trezor_failed_to_sign_transaction",
  //           info: { ...result, message, chain: this.chain, derivationPath: this.derivationPath },
  //         });
  //       }

  //       return result.payload.signature;
  //     };

  //     signTypedData();
  //     : Promise<string>
  //     {
  //       throw new Error("Not implemented");
  //     }

  //     signTransaction = async ({
  //       to,
  //       gasLimit,
  //       value,
  //       data,
  //       nonce,
  //       maxFeePerGas,
  //       maxPriorityFeePerGas,
  //       gasPrice,
  //       // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: any: refactor
  //     }: TransactionRequest) => {
  //       if (!to) throw new SwapKitError({ errorKey: "wallet_missing_params", info: { to } });
  //       if (!gasLimit)
  //         throw new SwapKitError({ errorKey: "wallet_missing_params", info: { gasLimit } });

  //       const isEIP1559 = maxFeePerGas && maxPriorityFeePerGas;

  //       if (isEIP1559 && !maxFeePerGas) {
  //         throw new SwapKitError({ errorKey: "wallet_missing_params", info: { maxFeePerGas } });
  //       }
  //       if (isEIP1559 && !maxPriorityFeePerGas) {
  //         throw new SwapKitError({
  //           errorKey: "wallet_missing_params",
  //           info: { maxPriorityFeePerGas },
  //         });
  //       }
  //       if (!(isEIP1559 || gasPrice)) {
  //         throw new SwapKitError({ errorKey: "wallet_missing_params", info: { gasPrice } });
  //       }

  //       const { default: TrezorConnect } = await import("@trezor/connect-web");
  //       const { toHexString } = await import("@swapkit/toolbox-evm");
  //       const { Transaction } = await import("ethers");

  //       const additionalFields = isEIP1559
  //         ? {
  //             maxFeePerGas: toHexString(BigInt(maxFeePerGas?.toString() || 0)),
  //             maxPriorityFeePerGas: toHexString(BigInt(maxPriorityFeePerGas?.toString() || 0)),
  //           }
  //         : (gasPrice && { gasPrice: toHexString(BigInt(gasPrice?.toString() || 0)) }) || {
  //             gasPrice: "0x0",
  //           };

  //       const hexifiedNonce = toHexString(
  //         BigInt(
  //           nonce || (await this.provider.getTransactionCount(await this.getAddress(), "pending")),
  //         ),
  //       );

  //       const formattedTx = {
  //         chainId: Number.parseInt(ChainToChainId[this.chain]),
  //         to: to.toString(),
  //         value: toHexString(BigInt(value?.toString() || 0)),
  //         gasLimit: toHexString(BigInt(gasLimit?.toString() || 0)),
  //         nonce: hexifiedNonce,
  //         data: data?.toString() || "0x",
  //         ...additionalFields,
  //       };

  //       const { success, payload } = await TrezorConnect.ethereumSignTransaction({
  //         path: derivationPathToString(this.derivationPath),
  //         transaction: formattedTx,
  //       });

  //       if (!success) {
  //         throw new SwapKitError({
  //           errorKey: "wallet_trezor_failed_to_sign_transaction",
  //           info: { ...payload, chain: this.chain, derivationPath: this.derivationPath },
  //         });
  //       }

  //       const { r, s, v } = payload;

  //       const signature = Signature.from({
  //         r,
  //         s,
  //         v: new SwapKitNumber(BigInt(v)).getBaseValue("number"),
  //       });

  //       const serializedTx = Transaction.from({
  //         ...formattedTx,
  //         nonce: Number.parseInt(formattedTx.nonce, 16),
  //         type: isEIP1559 ? 2 : 0,
  //         signature,
  //       }).serialized;

  //       if (!serializedTx) {
  //         throw new SwapKitError({
  //           errorKey: "wallet_trezor_failed_to_sign_transaction",
  //           info: { chain: this.chain, derivationPath: this.derivationPath },
  //         });
  //       }

  //       return serializedTx;
  //     };

  //     connect = (provider: Provider | null) => {
  //       if (!provider) {
  //         throw new SwapKitError({
  //           errorKey: "wallet_provider_not_found",
  //           info: {
  //             wallet: WalletOption.TREZOR,
  //             chain: this.chain,
  //             derivationPath: this.derivationPath,
  //           },
  //         });
  //       }

  //       return new TrezorSigner({
  //         chain: this.chain,
  //         derivationPath: this.derivationPath,
  //         provider,
  //       });
  //     };
  //   }

  return {
    address,
    sign,
  };
}
