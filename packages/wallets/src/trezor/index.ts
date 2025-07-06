import {
  Chain,
  type DerivationPathArray,
  FeeOption,
  type GenericTransferParams,
  SKConfig,
  SwapKitError,
  WalletOption,
  createWallet,
  derivationPathToString,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { UTXOToolboxes, UTXOType } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import { getWalletSupportedChains } from "../utils";

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
}: { chain: T; derivationPath: DerivationPathArray }) {
  switch (chain) {
    case Chain.BinanceSmartChain:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Base:
    case Chain.Ethereum: {
      const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const { getEVMSigner } = await import("./evmSigner");

      const provider = await getProvider(chain);
      const signer = await getEVMSigner({ chain, derivationPath, provider });
      const address = await signer.getAddress();
      const toolbox = await getEvmToolbox(chain, { provider, signer });

      return { ...toolbox, address };
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { toCashAddress, getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const scriptType = getScriptType(derivationPath);

      if (!scriptType) {
        throw new SwapKitError({
          errorKey: "wallet_trezor_derivation_path_not_supported",
          info: { derivationPath },
        });
      }

      const coin = chain.toLowerCase();

      const getAddress = async (path: DerivationPathArray = derivationPath) => {
        const TrezorConnect = (await import("@trezor/connect-web")).default;
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
            prev_hash: hash,
            prev_index: index,
            // object needs amount but does not use it for signing
            amount: value,
            script_type: scriptType.input,
          })),
          outputs: psbt.txOutputs.map((output) => {
            // OP_RETURN
            if (!output.address) {
              return {
                amount: "0",
                op_return_data: Buffer.from(memo).toString("hex"),
                script_type: "PAYTOOPRETURN",
              };
            }

            const outputAddress =
              chain === Chain.BitcoinCash
                ? toolbox.stripPrefix(toCashAddress(output.address))
                : output.address;

            const isChangeAddress = outputAddress === address;

            return isChangeAddress
              ? { amount: output.value, address_n, script_type: scriptType.output }
              : { amount: output.value, address: outputAddress, script_type: "PAYTOADDRESS" };
          }),
        });

        if (result.success) {
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
        recipient,
        feeOptionKey,
        feeRate: paramFeeRate,
        memo,
        ...rest
      }: GenericTransferParams) => {
        if (!(address && recipient)) {
          throw new SwapKitError({
            errorKey: "wallet_missing_params",
            info: { wallet: WalletOption.TREZOR, memo, address, recipient },
          });
        }

        const toolbox = await getUtxoToolbox(chain);

        const feeRate =
          paramFeeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast];

        const createTxMethod =
          chain === Chain.BitcoinCash
            ? (toolbox as UTXOToolboxes["BCH"]).buildTx
            : (toolbox as UTXOToolboxes["BTC"]).createTransaction;

        const { psbt, inputs } = await createTxMethod({
          ...rest,
          memo,
          recipient,
          feeRate,
          sender: address,
          fetchTxHex: true,
        });

        const txHex = await signTransaction(psbt, inputs, memo);
        const tx = await toolbox.broadcastTx(txHex);

        return tx;
      };

      const toolbox = await getUtxoToolbox(chain);

      return { ...toolbox, address, transfer, signTransaction };
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

      const TrezorConnect = (await import("@trezor/connect-web")).default;
      const { success } = await TrezorConnect.getDeviceState();

      if (!success) {
        const trezorConfig = SKConfig.get("integrations").trezor;
        const manifest = trezorConfig
          ? {
              ...trezorConfig,
              appName: (trezorConfig as any).appName || "SwapKit",
            }
          : {
              appUrl: "",
              email: "",
              appName: "SwapKit",
            };
        TrezorConnect.init({ lazyLoad: true, manifest });
      }

      const wallet = await getTrezorWallet({ chain, derivationPath });

      addChain({ ...wallet, chain, walletType });

      return true;
    },
});

export const TREZOR_SUPPORTED_CHAINS = getWalletSupportedChains(trezorWallet);
