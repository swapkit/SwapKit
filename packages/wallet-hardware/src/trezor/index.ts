import type { ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import {
  Chain,
  type DerivationPathArray,
  derivationPathToString,
  FeeOption,
  filterSupportedChains,
  type GenericTransferParams,
  SKConfig,
  SwapKitError,
  WalletOption,
} from "@swapkit/helpers";
import type { UTXOToolboxes, UTXOType } from "@swapkit/toolboxes/utxo";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import type { Psbt } from "bitcoinjs-lib";

function getScriptType(derivationPath: DerivationPathArray) {
  switch (derivationPath[0]) {
    case 84:
      return { input: "SPENDWITNESS", output: "PAYTOWITNESS" } as const;
    case 49:
      return { input: "SPENDP2SHWITNESS", output: "PAYTOP2SHWITNESS" } as const;
    case 44:
      return { input: "SPENDADDRESS", output: "PAYTOADDRESS" } as const;
    default:
      return null;
  }
}

async function getTrezorWallet<T extends Chain>({
  chain,
  derivationPath,
}: {
  chain: T;
  derivationPath: DerivationPathArray;
}) {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Aurora:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Gnosis:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const { getEVMSigner } = await import("./evmSigner");

      const provider = await getProvider(chain);
      const signer = await getEVMSigner({ chain, derivationPath, provider });
      const address = await signer.getAddress();
      const toolbox = await getEvmToolbox(chain, { provider, signer });

      return { ...toolbox, address };
    }

    case Chain.Zcash: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");

      const derivationPathStr = derivationPathToString(derivationPath);

      const getAddress = async () => {
        const TrezorConnect = (await import("@trezor/connect-web")).default;
        const { success, payload } = await TrezorConnect.getAddress({
          path: derivationPathStr,
          coin: "zec",
        });

        if (!success) {
          throw new SwapKitError({
            errorKey: "wallet_trezor_failed_to_get_address",
            info: {
              chain,
              error: (payload as { error: string; code?: string }).error || "Unknown error",
            },
          });
        }

        return payload.address;
      };

      const address = await getAddress();

      // Create a signer that works with ZcashPsbt
      const signer = {
        getAddress: async () => address,
        signTransaction: async (zcashPsbt: ZcashPsbt) => {
          const TrezorConnect = (await import("@trezor/connect-web")).default;
          const address_n = derivationPath.map((pathElement, index) =>
            index < 3 ? ((pathElement as number) | 0x80000000) >>> 0 : (pathElement as number),
          );

          // Extract Zcash-specific parameters from the PSBT
          // Use getVersion() method instead of accessing protected tx property
          const version = 4; // Sapling version
          const versionGroupId = 0x892f2085; // Sapling
          const branchId = 0xe9ff75a6; // Canopy

          const inputs = zcashPsbt.txInputs.map((input, idx) => ({
            address_n,
            prev_hash: input.hash.reverse().toString("hex"),
            prev_index: input.index,
            amount: zcashPsbt.data.inputs[idx]?.witnessUtxo?.value?.toString() || "0",
            script_type: "SPENDADDRESS" as const,
          }));

          const result = await TrezorConnect.signTransaction({
            coin: "zec",
            inputs,
            outputs: zcashPsbt.txOutputs.map((output) => {
              // OP_RETURN
              if (!output.address) {
                return {
                  amount: "0",
                  op_return_data: output.script.toString("hex"),
                  script_type: "PAYTOOPRETURN",
                };
              }

              const outputAddress = output.address;

              const isChangeAddress = outputAddress === address;

              return isChangeAddress
                ? { amount: output.value.toString(), address_n, script_type: "PAYTOADDRESS" }
                : {
                    amount: output.value.toString(),
                    address: outputAddress,
                    script_type: "PAYTOADDRESS",
                  };
            }),
            version,
            versionGroupId,
            branchId,
            overwintered: true,
          }); // Type assertion needed due to Trezor Connect types not supporting PAYTOOPRETURN

          if (!result.success) {
            throw new SwapKitError({
              errorKey: "wallet_trezor_failed_to_sign_transaction",
              info: {
                chain,
                error: (result.payload as { error: string; code?: string }).error,
              },
            });
          }

          // Trezor returns the fully signed transaction hex
          // We need to update the PSBT with the signatures and finalize it
          // For now, we'll store the signed tx hex in a way the toolbox can use
          return result.payload.serializedTx;
        },
      };

      const toolbox = await getUtxoToolbox(Chain.Zcash);

      const transfer = async (params: GenericTransferParams) => {
        if (!(address && params.recipient)) {
          throw new SwapKitError({
            errorKey: "wallet_missing_params",
            info: { wallet: WalletOption.TREZOR, address, recipient: params.recipient },
          });
        }

        const feeRate =
          params.feeRate || (await toolbox.getFeeRates())[params.feeOptionKey || FeeOption.Fast];

        const { psbt } = await toolbox.createTransaction({
          ...params,
          sender: address,
          feeRate,
          fetchTxHex: false,
        });

        const signedPsbt = await signer.signTransaction(psbt);
        // Extract the signed transaction hex that we stored
        const txHex = (signedPsbt as any).signedTxHex;
        if (!txHex) {
          throw new SwapKitError({
            errorKey: "wallet_trezor_failed_to_sign_transaction",
            info: { chain, error: "No signed transaction hex returned" },
          });
        }
        return toolbox.broadcastTx(txHex);
      };

      return { ...toolbox, address, transfer, signTransaction: signer.signTransaction };
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { toCashAddress, getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const scriptType = getScriptType(derivationPath);

      if (!scriptType) {
        throw new SwapKitError({ errorKey: "wallet_trezor_derivation_path_not_supported", info: { derivationPath } });
      }

      const coin = chain.toLowerCase();

      const getAddress = async (path: DerivationPathArray = derivationPath) => {
        const TrezorConnect = (await import("@trezor/connect-web")).default;
        const { success, payload } = await TrezorConnect.getAddress({ coin, path: derivationPathToString(path) });

        if (!success) {
          throw new SwapKitError({
            errorKey: "wallet_trezor_failed_to_get_address",
            info: { chain, error: (payload as { error: string; code?: string }).error || "Unknown error" },
          });
        }

        if (chain === Chain.BitcoinCash) {
          const toolbox = await getUtxoToolbox(chain as Chain.BitcoinCash);
          return toolbox.stripPrefix(payload.address);
        }

        return payload.address;
      };

      const address = await getAddress();

      const signTransaction = async (psbt: Psbt, inputs: UTXOType[], memo = "") => {
        const TrezorConnect = (await import("@trezor/connect-web")).default;
        const address_n = derivationPath.map((pathElement, index) =>
          index < 3 ? ((pathElement as number) | 0x80000000) >>> 0 : (pathElement as number),
        );
        const toolbox = await getUtxoToolbox(chain as Chain.BitcoinCash);

        const result = await TrezorConnect.signTransaction({
          coin,
          inputs: inputs.map(({ hash, index, value }) => ({
            // Hardens the first 3 elements of the derivation path - required by trezor
            address_n,
            // object needs amount but does not use it for signing
            amount: value,
            prev_hash: hash,
            prev_index: index,
            script_type: scriptType.input,
          })),
          outputs: psbt.txOutputs.map((output) => {
            // OP_RETURN
            if (!output.address) {
              return { amount: "0", op_return_data: Buffer.from(memo).toString("hex"), script_type: "PAYTOOPRETURN" };
            }

            const outputAddress =
              chain === Chain.BitcoinCash ? toolbox.stripPrefix(toCashAddress(output.address)) : output.address;

            const isChangeAddress = outputAddress === address;

            return isChangeAddress
              ? { address_n, amount: output.value, script_type: scriptType.output }
              : { address: outputAddress, amount: output.value, script_type: "PAYTOADDRESS" };
          }),
        });

        if (result.success) {
          return result.payload.serializedTx;
        }

        throw new SwapKitError({
          errorKey: "wallet_trezor_failed_to_sign_transaction",
          info: { chain, error: (result.payload as { error: string; code?: string }).error },
        });
      };

      const transfer = async ({
        recipient,
        feeOptionKey,
        feeRate: paramFeeRate,
        memo,
        ...rest
      }: GenericTransferParams) => {
        if (!(address && recipient)) {
          throw new SwapKitError({
            errorKey: "wallet_missing_params",
            info: { address, memo, recipient, wallet: WalletOption.TREZOR },
          });
        }

        const toolbox = await getUtxoToolbox(chain);

        const feeRate = paramFeeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast];

        const createTxMethod =
          chain === Chain.BitcoinCash
            ? (toolbox as UTXOToolboxes["BCH"]).buildTx
            : (toolbox as UTXOToolboxes["BTC"]).createTransaction;

        const { psbt, inputs } = await createTxMethod({
          ...rest,
          feeRate,
          fetchTxHex: true,
          memo,
          recipient,
          sender: address,
        });

        const txHex = await signTransaction(psbt, inputs, memo);
        const tx = await toolbox.broadcastTx(txHex);

        return tx;
      };

      const toolbox = await getUtxoToolbox(chain);

      return { ...toolbox, address, signTransaction, transfer };
    }

    default:
      throw new SwapKitError({ errorKey: "wallet_chain_not_supported", info: { chain, wallet: WalletOption.TREZOR } });
  }
}

export const trezorWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectTrezor(chains: Chain[], derivationPath: DerivationPathArray) {
      const [chain] = filterSupportedChains({ chains, supportedChains, walletType });
      if (!chain) {
        throw new SwapKitError({
          errorKey: "wallet_chain_not_supported",
          info: { chain, wallet: WalletOption.TREZOR },
        });
      }

      const TrezorConnect = (await import("@trezor/connect-web")).default;
      const { success } = await TrezorConnect.getDeviceState();

      if (!success) {
        const trezorConfig = SKConfig.get("integrations").trezor;
        const manifest = trezorConfig
          ? { ...trezorConfig, appName: (trezorConfig as any).appName || "SwapKit" }
          : { appName: "SwapKit", appUrl: "", email: "" };
        TrezorConnect.init({ lazyLoad: true, manifest });
      }

      const wallet = await getTrezorWallet({ chain, derivationPath });

      addChain({ ...wallet, chain, walletType });

      return true;
    },
  name: "connectTrezor",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Aurora,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Gnosis,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.Zcash,
  ],
  walletType: WalletOption.TREZOR,
});

export const TREZOR_SUPPORTED_CHAINS = getWalletSupportedChains(trezorWallet);
