import type { Wallet } from "@passkeys/core";
import {
  type AssetValue,
  Chain,
  EVMChains,
  type GenericTransferParams,
  SwapKitError,
  WalletOption,
  filterSupportedChains,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { Psbt } from "bitcoinjs-lib";
// BrowserProvider imported dynamically when needed
import {
  AddressPurpose,
  BitcoinNetworkType,
  type GetAddressOptions,
  type GetAddressResponse,
  type SignTransactionOptions,
  getAddress,
  signTransaction as satsSignTransaction,
} from "sats-connect";

async function getWalletMethods({
  wallet,
  chain,
}: {
  wallet: Wallet;
  chain: Chain;
}) {
  switch (chain) {
    case Chain.Bitcoin: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const provider = await wallet.getProvider("bitcoin");

      if (!provider) {
        throw new SwapKitError("wallet_exodus_not_found");
      }

      let address = "";

      const getProvider = () => Promise.resolve(provider);

      const getAddressOptions: GetAddressOptions = {
        getProvider,
        payload: {
          purposes: [AddressPurpose.Payment],
          message: "Address for receiving and sending payments",
          network: { type: BitcoinNetworkType.Mainnet },
        },
        onFinish: (response: GetAddressResponse) => {
          if (!response.addresses[0]) throw new SwapKitError("wallet_exodus_no_address");
          address = response.addresses[0].address;
        },
        onCancel: () => {
          throw new SwapKitError("wallet_exodus_request_canceled");
        },
      };

      // TODO: Towan - probably not needed ?
      await getAddress(getAddressOptions);

      async function signTransaction(psbt: Psbt) {
        let signedPsbt: Psbt | undefined;
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
              { address: address, signingIndexes: psbt.txInputs.map((_, index) => index) },
            ],
          },
          onFinish: (response) => {
            signedPsbt = Psbt.fromBase64(response.psbtBase64);
          },
          onCancel: () => {
            throw new SwapKitError("wallet_exodus_signature_canceled");
          },
        };

        await satsSignTransaction(signPsbtOptions);
        if (!signedPsbt) throw new SwapKitError("wallet_exodus_sign_transaction_error");
        return signedPsbt;
      }

      const signer = {
        signTransaction,
        getAddress: () => Promise.resolve(address),
      };
      const toolbox = await getUtxoToolbox(chain, { signer });

      return { ...toolbox, address };
    }
    case Chain.Arbitrum:
    case Chain.Aurora:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const { BrowserProvider } = await import("ethers");

      const walletProvider = await wallet.getProvider("ethereum");
      if (!walletProvider) {
        throw new SwapKitError("wallet_exodus_not_found");
      }

      const jsonRpcProvider = await getProvider(chain);
      const browserProvider = new BrowserProvider(walletProvider, "any");

      await browserProvider.send("eth_requestAccounts", []);

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const toolbox = await getEvmToolbox(chain, { provider: jsonRpcProvider, signer });

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = toolbox.getNetworkParams();
          await switchEVMWalletNetwork(browserProvider, chain, networkParams);
        }
      } catch (_error) {
        throw new SwapKitError("wallet_exodus_failed_to_switch_network", { chain });
      }

      return { ...prepareNetworkSwitch({ toolbox, chain, provider: browserProvider }), address };
    }

    case Chain.Solana: {
      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const provider = await wallet.getProvider("solana");

      if (!provider) {
        throw new SwapKitError("wallet_exodus_not_found");
      }

      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();
      const toolbox = await getSolanaToolbox();

      const transfer = async ({
        recipient,
        assetValue,
        isProgramDerivedAddress,
      }: GenericTransferParams & { assetValue: AssetValue; isProgramDerivedAddress?: boolean }) => {
        // const { PublicKey } = await import("@solana/web3.js"); // TODO: Use for advanced transactions
        const validateAddress = await toolbox.getAddressValidator();

        if (!(isProgramDerivedAddress || validateAddress(recipient))) {
          throw new SwapKitError("core_transaction_invalid_recipient_address");
        }

        // const fromPubkey = new PublicKey(address); // TODO: Use for advanced transactions
        const connection = await toolbox.getConnection();

        const transaction = await toolbox.createTransaction({
          recipient,
          assetValue,
          sender: address,
          isProgramDerivedAddress,
        });

        const signedTransaction = await provider.signTransaction(transaction);
        const serialized = signedTransaction.serialize();
        const txHash = await connection.sendRawTransaction(serialized);

        return txHash;
      };

      const disconnect = async () => {
        await provider.disconnect();
      };

      return { ...toolbox, address, transfer, disconnect };
    }

    default:
      throw new SwapKitError("wallet_exodus_chain_not_supported", { chain });
  }
}

export const exodusWallet = createWallet({
  name: "connectExodusWallet",
  walletType: WalletOption.EXODUS,
  supportedChains: [...EVMChains, Chain.Bitcoin, Chain.Solana],
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectExodusWallet(chains: Chain[], wallet: Wallet) {
      if (!wallet) throw new SwapKitError("wallet_exodus_instance_missing");
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          try {
            const walletData = await getWalletMethods({
              chain,
              wallet,
            });

            const { address, ...walletMethods } = walletData;
            const disconnect = wallet.disconnect;

            const finalDisconnect =
              disconnect ||
              (async () => {
                if (wallet.disconnect) {
                  await wallet.disconnect();
                }
              });

            addChain({
              ...walletMethods,
              disconnect: finalDisconnect,
              chain,
              address,
              walletType: WalletOption.EXODUS,
            });
          } catch (error) {
            console.error(`Failed to connect ${chain} wallet:`, error);
            throw error;
          }
        }),
      );

      return true;
    },
});

export const EXODUS_SUPPORTED_CHAINS = getWalletSupportedChains(exodusWallet);
export * from "@passkeys/react";
export * from "@passkeys/core";
