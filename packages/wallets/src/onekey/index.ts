import {
  type AssetValue,
  Chain,
  type NetworkParams,
  SKConfig,
  SwapKitError,
  WalletOption,
  type WalletTxParams,
  addEVMWalletNetwork,
  createWallet,
  filterSupportedChains,
  prepareNetworkSwitch,
} from "@swapkit/helpers";
import type { UTXOTransferParams } from "@swapkit/toolboxes/utxo";
import type {
  BitcoinProvider,
  GetAddressOptions,
  GetAddressResponse,
  SignTransactionOptions,
} from "sats-connect";
import { getWalletSupportedChains } from "../utils";

async function getWalletMethodsForExtension(chain: Chain) {
  switch (chain) {
    case Chain.Bitcoin: {
      if (!window.$onekey?.btc) {
        throw new SwapKitError({
          errorKey: "wallet_onekey_not_found",
          info: { chain },
        });
      }

      const { Psbt } = await import("bitcoinjs-lib");
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const {
        signTransaction: satsSignTransaction,
        getAddress,
        AddressPurpose,
        BitcoinNetworkType,
      } = await import("sats-connect");

      const toolbox = await getUtxoToolbox(chain);

      let address = "";

      const getProvider: () => Promise<BitcoinProvider | undefined> = () =>
        new Promise((res) => res(window.$onekey?.btc as BitcoinProvider));

      const getAddressOptions: GetAddressOptions = {
        getProvider,
        payload: {
          purposes: [AddressPurpose.Payment],
          message: "Address for receiving and sending payments",
          network: { type: BitcoinNetworkType.Mainnet },
        },
        onFinish: (response: GetAddressResponse) => {
          if (response.addresses[0]?.address) {
            address = response.addresses[0].address;
          }
        },
        onCancel: () => {
          throw new SwapKitError("wallet_connection_rejected_by_user");
        },
      };

      await getAddress(getAddressOptions);

      async function signTransaction(psbt: any) {
        let signedPsbt: any;
        const signPsbtOptions: SignTransactionOptions = {
          getProvider,
          payload: {
            message: "Sign transaction",
            network: {
              type: BitcoinNetworkType.Mainnet,
            },
            psbtBase64: psbt.toBase64(),
            broadcast: false,
            inputsToSign: [
              {
                address,
                signingIndexes: psbt.txInputs.map((_: any, index: number) => index),
              },
            ],
          },
          onFinish: (response) => {
            signedPsbt = Psbt.fromBase64(response.psbtBase64);
          },
          onCancel: () => {
            throw new SwapKitError("wallet_connection_rejected_by_user");
          },
        };

        await satsSignTransaction(signPsbtOptions);
        if (!signedPsbt) throw new SwapKitError("wallet_onekey_sign_transaction_error");
        return signedPsbt;
      }

      const transfer = (transferParams: UTXOTransferParams) => {
        return toolbox.transfer({
          ...transferParams,
          signTransaction,
        });
      };

      return { ...toolbox, transfer, address };
    }

    case Chain.Solana: {
      if (!window.$onekey?.sol) {
        throw new SwapKitError({
          errorKey: "wallet_onekey_not_found",
          info: { chain },
        });
      }

      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const { Transaction, PublicKey } = await import("@solana/web3.js");

      const address = await window.$onekey.sol.getAddress();
      const toolbox = getSolanaToolbox();

      const transfer = async ({
        recipient,
        assetValue,
        isPDA,
      }: WalletTxParams & {
        assetValue: AssetValue;
        isPDA?: boolean;
      }) => {
        try {
          if (!recipient) throw new SwapKitError("core_transaction_invalid_recipient_address");
          if (!assetValue) throw new SwapKitError("wallet_missing_params");

          const transaction = await toolbox.createSolanaTransaction({
            fromPublicKey: new PublicKey(address),
            recipient,
            assetValue,
            isProgramDerivedAddress: isPDA,
          });

          const tx = Transaction.from(
            Buffer.from(transaction.serialize({ requireAllSignatures: false })),
          );
          const signedTransaction = await window.$onekey.sol.signTransaction(tx);
          const signature = await toolbox.broadcastTransaction(signedTransaction.serialize());

          return signature;
        } catch (error) {
          console.error(error);
          throw new SwapKitError("core_transaction_failed", { error });
        }
      };

      return { ...toolbox, transfer, address };
    }

    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      if (!window.$onekey?.ethereum) {
        throw new SwapKitError({
          errorKey: "wallet_onekey_not_found",
          info: { chain },
        });
      }

      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(window.$onekey.ethereum, "any");

      const rpcUrl = SKConfig.get("rpcUrls")[chain];

      await provider.send("eth_requestAccounts", []);
      const jsonRpcProvider = await getProvider(chain, rpcUrl);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const toolbox = await getEvmToolbox(chain, { provider: jsonRpcProvider, signer });
      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = toolbox.getNetworkParams() as NetworkParams;

          await addEVMWalletNetwork(provider, networkParams);
        }
      } catch (error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { chain, error },
        });
      }

      return {
        address,
        ...prepareNetworkSwitch({ toolbox, chain, provider }),
      };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.ONEKEY },
      });
  }
}

export const onekeyWallet = createWallet({
  name: "connectOnekeyWallet",
  walletType: WalletOption.ONEKEY,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.Optimism,
    Chain.Polygon,
    Chain.Solana,
  ],
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectOnekeyWallet(chains: Chain[]) {
      if (!window.$onekey) {
        throw new SwapKitError({
          errorKey: "wallet_onekey_not_found",
          info: { wallet: WalletOption.ONEKEY },
        });
      }

      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const { address, ...walletMethods } = await getWalletMethodsForExtension(chain);

          addChain({ ...walletMethods, chain, address, walletType });
        }),
      );

      return true;
    },
});

export const ONEKEY_WALLET_SUPPORTED_CHAINS = getWalletSupportedChains(onekeyWallet);
