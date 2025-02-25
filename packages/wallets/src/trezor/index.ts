import {
  Chain,
  type DerivationPathArray,
  FeeOption,
  SKConfig,
  SwapKitError,
  WalletOption,
  createWallet,
  derivationPathToString,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { UTXOTransferParams, UTXOType } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import { getWalletSupportedChains } from "../helpers";

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

async function getToolbox({
  chain,
  derivationPath,
}: { chain: Chain; derivationPath: DerivationPathArray }) {
  switch (chain) {
    case Chain.BinanceSmartChain:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Base:
    case Chain.Ethereum: {
      const { getProvider, getToolboxByChain } = await import("@swapkit/toolboxes/evm");
      const { getEVMSigner } = await import("./evmSigner");

      const provider = getProvider(chain);
      const signer = await getEVMSigner({ chain, derivationPath, provider });
      const address = await signer.getAddress();
      const toolbox = getToolboxByChain(chain)({ provider, signer });

      return { address, walletMethods: toolbox };
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { toCashAddress, getToolboxByChain, BCHToolbox } = await import(
        "@swapkit/toolboxes/utxo"
      );

      const scriptType = getScriptType(derivationPath);

      if (!scriptType) {
        throw new SwapKitError({
          errorKey: "wallet_trezor_derivation_path_not_supported",
          info: { derivationPath },
        });
      }

      const coin = chain.toLowerCase();
      const toolbox = getToolboxByChain(chain)();

      const getAddress = async (path: DerivationPathArray = derivationPath) => {
        const { default: TrezorConnect } = await import("@trezor/connect-web");
        const { success, payload } = await TrezorConnect.getAddress({
          path: derivationPathToString(path),
          coin,
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

        return chain === Chain.BitcoinCash
          ? (toolbox as ReturnType<typeof BCHToolbox>).stripPrefix(payload.address)
          : payload.address;
      };

      const address = await getAddress();

      const signTransaction = async (psbt: Psbt, inputs: UTXOType[], memo = "") => {
        const { default: TrezorConnect } = await import("@trezor/connect-web");
        const address_n = derivationPath.map((pathElement, index) =>
          index < 3 ? ((pathElement as number) | 0x80000000) >>> 0 : (pathElement as number),
        );

        const result = await TrezorConnect.signTransaction({
          coin,
          inputs: inputs.map((input) => ({
            // Hardens the first 3 elements of the derivation path - required by trezor
            address_n,
            prev_hash: input.hash,
            prev_index: input.index,
            // object needs amount but does not use it for signing
            amount: input.value,
            script_type: scriptType.input,
          })),

          // Lint is not happy with the type of txOutputs
          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: refactor
          outputs: psbt.txOutputs.map((output: any) => {
            const outputAddress =
              chain === Chain.BitcoinCash && output.address
                ? toCashAddress(output.address)
                : output.address;

            // Strip prefix from BCH address to compare with stripped address from Trezor
            const isChangeAddress =
              chain === Chain.BitcoinCash && outputAddress
                ? (toolbox as ReturnType<typeof BCHToolbox>).stripPrefix(outputAddress) === address
                : outputAddress === address;

            // OP_RETURN
            if (!output.address) {
              return {
                amount: "0",
                op_return_data: Buffer.from(memo).toString("hex"),
                script_type: "PAYTOOPRETURN",
              };
            }

            // Change Address
            if (isChangeAddress) {
              return { address_n, amount: output.value, script_type: scriptType.output };
            }

            // Outgoing UTXO
            return { address: outputAddress, amount: output.value, script_type: "PAYTOADDRESS" };
          }),
        });

        if (result.success && result.payload?.serializedTx) {
          return result.payload.serializedTx;
        }

        throw new SwapKitError({
          errorKey: "wallet_trezor_failed_to_sign_transaction",
          info: {
            chain,
            error: (result.payload as { error: string; code?: string }).error,
          },
        });
      };

      const transfer = async ({
        from,
        recipient,
        feeOptionKey,
        feeRate: paramFeeRate,
        memo,
        ...rest
      }: UTXOTransferParams) => {
        if (!(from && recipient)) {
          throw new SwapKitError({
            errorKey: "wallet_missing_params",
            info: { wallet: WalletOption.TREZOR, memo, from, recipient },
          });
        }

        const feeRate =
          paramFeeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast];

        const { psbt, inputs } = await toolbox.buildTx({
          ...rest,
          memo,
          recipient,
          feeRate,
          sender: from,
          fetchTxHex: chain === Chain.Dogecoin,
        });

        const txHex = await signTransaction(psbt, inputs, memo);
        const tx = await toolbox.broadcastTx(txHex);

        return tx;
      };

      return { address, walletMethods: { ...toolbox, transfer, signTransaction } };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.TREZOR },
      });
  }
}

export const trezorWallet = createWallet({
  name: "connectTrezor",
  walletType: WalletOption.TREZOR,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
  ],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectTrezor(chains: Chain[], derivationPath: DerivationPathArray) {
      const [chain] = filterSupportedChains({ chains, supportedChains, walletType });
      if (!chain) {
        throw new SwapKitError({
          errorKey: "wallet_chain_not_supported",
          info: { chain, wallet: WalletOption.TREZOR },
        });
      }

      const { default: TrezorConnect } = await import("@trezor/connect-web");
      const { success } = await TrezorConnect.getDeviceState();

      if (!success) {
        const manifest = SKConfig.get("integrations").trezor || { appUrl: "", email: "" };
        TrezorConnect.init({ lazyLoad: true, manifest });
      }

      const { address, walletMethods } = await getToolbox({ chain, derivationPath });

      addChain({ ...walletMethods, address, chain, walletType });

      return true;
    },
});

export const TREZOR_SUPPORTED_CHAINS = getWalletSupportedChains(trezorWallet);
