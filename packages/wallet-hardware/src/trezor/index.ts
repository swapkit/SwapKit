import type { UtxoPsbt, ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import {
  Chain,
  type DerivationPathArray,
  derivationPathToString,
  FeeOption,
  filterSupportedChains,
  type GenericTransferParams,
  SKConfig,
  SwapKitError,
  type UTXOChain,
  WalletOption,
} from "@swapkit/helpers";
import { stripPrefix } from "@swapkit/toolboxes/utxo";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { type Psbt, Transaction } from "bitcoinjs-lib";

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
        const { success, payload } = await TrezorConnect.getAddress({ coin: "zec", path: derivationPathStr });

        if (!success) {
          throw new SwapKitError({
            errorKey: "wallet_trezor_failed_to_get_address",
            info: { chain, error: (payload as { error: string; code?: string }).error || "Unknown error" },
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
            amount: zcashPsbt.data.inputs[idx]?.witnessUtxo?.value?.toString() || "0",
            prev_hash: input.hash.reverse().toString("hex"),
            prev_index: input.index,
            script_type: "SPENDADDRESS" as const,
          }));

          const result = await TrezorConnect.signTransaction({
            branchId,
            coin: "zec",
            inputs,
            outputs: zcashPsbt.txOutputs.map((output) => {
              // OP_RETURN
              if (!output.address) {
                return { amount: "0", op_return_data: output.script.toString("hex"), script_type: "PAYTOOPRETURN" };
              }

              const outputAddress = output.address;

              const isChangeAddress = outputAddress === address;

              return isChangeAddress
                ? { address_n, amount: output.value.toString(), script_type: "PAYTOADDRESS" }
                : { address: outputAddress, amount: output.value.toString(), script_type: "PAYTOADDRESS" };
            }),
            overwintered: true,
            version,
            versionGroupId,
          }); // Type assertion needed due to Trezor Connect types not supporting PAYTOOPRETURN

          if (!result.success) {
            throw new SwapKitError({
              errorKey: "wallet_trezor_failed_to_sign_transaction",
              info: { chain, error: (result.payload as { error: string; code?: string }).error },
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
            info: { address, recipient: params.recipient, wallet: WalletOption.TREZOR },
          });
        }

        const feeRate = params.feeRate || (await toolbox.getFeeRates())[params.feeOptionKey || FeeOption.Fast];

        const { psbt } = await toolbox.createTransaction({ ...params, feeRate, fetchTxHex: false, sender: address });

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

      return { ...toolbox, address, signTransaction: signer.signTransaction, transfer };
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

      function psbtToTrezorParams(psbt: Psbt | UtxoPsbt) {
        if (!scriptType) {
          throw new SwapKitError({ errorKey: "wallet_trezor_derivation_path_not_supported", info: { derivationPath } });
        }
        const address_n = derivationPath.map((pathElement, index) =>
          index < 3 ? ((pathElement as number) | 0x80000000) >>> 0 : (pathElement as number),
        );
        // 1. Map Inputs (logic remains the same)
        const inputs = psbt.data.inputs.map((input, index) => {
          const txInput = psbt.txInputs[index];
          let utxoValue: number;

          // ---- THIS IS THE CRITICAL LOGIC ----
          if (input.witnessUtxo) {
            // Use this path for SegWit inputs (BTC, LTC)
            utxoValue = Number(input.witnessUtxo.value);
          } else if (input.nonWitnessUtxo) {
            const prevTx = Transaction.fromBuffer(input.nonWitnessUtxo);
            utxoValue = prevTx.outs[txInput?.index || 0]?.value || 0;
          } else {
            // This is an invalid PSBT for signing; it's missing the necessary UTXO info.
            throw new Error(`PSBT input ${index} is missing both witnessUtxo and nonWitnessUtxo.`);
          }
          // ------------------------------------

          const bip32Derivation = input.bip32Derivation?.[0];
          if (!bip32Derivation) {
            throw new Error(`PSBT input ${index} is missing derivation path required by KeepKey.`);
          }

          // ... logic to determine scriptType from the UTXO's script ...
          const txid = Buffer.from(psbt.txInputs[index]?.hash || "")
            .reverse()
            .toString("hex");

          return { address_n, amount: utxoValue, prev_hash: txid, prev_index: index, script_type: scriptType.input };
        });

        // 2. MAP OUTPUTS & SEPARATE THE MEMO (OP_RETURN)
        const memo = psbt.txOutputs
          .find((output) => output.script && output.script[0] === 0x6a)
          ?.script.slice(1)
          .toString("utf8");

        const outputs = psbt.txOutputs
          .map((output) => {
            // OP_RETURN
            if (!output.address && memo) {
              return {
                amount: "0",
                op_return_data: Buffer.from(memo).toString("hex"),
                script_type: "PAYTOOPRETURN" as const,
              };
            }

            if (!output.address) return null;

            const outputAddress =
              chain === Chain.BitcoinCash ? stripPrefix(toCashAddress(output.address)) : output.address;

            const isChangeAddress = outputAddress === address;

            return isChangeAddress
              ? { address_n, amount: output.value, script_type: scriptType.output }
              : { address: outputAddress, amount: output.value, script_type: "PAYTOADDRESS" as const };
          })
          .filter((output) => output !== null);

        // 3. Return the final object for KeepKey
        return { inputs, outputs };
      }

      const signTransaction = async <T extends Psbt | UtxoPsbt>(psbt: T) => {
        const TrezorConnect = (await import("@trezor/connect-web")).default;

        const { inputs, outputs } = psbtToTrezorParams(psbt);

        // @ts-expect-error
        const result = await TrezorConnect.signTransaction({ coin, inputs, outputs });

        if (result.success) {
          const signatures = result.payload.signatures;

          psbt.data.inputs.forEach((input, index) => {
            if (!input.bip32Derivation || !input.bip32Derivation[0]) {
              return;
            }

            const signatureHex = signatures[index];
            if (!signatureHex) {
              throw new Error(`Trezor did not return a signature for input ${index}`);
            }

            const pubkey = input.bip32Derivation[0].pubkey;

            psbt.updateInput(index, { partialSig: [{ pubkey, signature: Buffer.from(signatureHex, "hex") }] });
          });

          return psbt;
        }

        // Handle the error case
        throw new SwapKitError({
          errorKey: "wallet_trezor_failed_to_sign_transaction",
          info: { chain, error: (result.payload as { error: string; code?: string }).error },
        });
      };

      const signer = { getAddress: async () => address, signTransaction: signTransaction };
      const toolbox = await getUtxoToolbox<Exclude<UTXOChain, Chain.Zcash>>(chain, { signer });

      return { ...toolbox, address };
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
