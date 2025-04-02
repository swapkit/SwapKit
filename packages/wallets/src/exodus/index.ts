import type { Wallet } from "@passkeys/core";
import {
  Chain,
  EVMChains,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { UTXOTransferParams } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import type { BrowserProvider, Eip1193Provider } from "ethers";
import {
  AddressPurpose,
  BitcoinNetworkType,
  type BitcoinProvider,
  type GetAddressOptions,
  type GetAddressResponse,
  type SignTransactionOptions,
  getAddress,
  signTransaction as satsSignTransaction,
} from "sats-connect";
import { getWalletSupportedChains } from "../utils";

async function getWalletMethods({
  walletProvider,
  provider,
  chain,
}: {
  walletProvider?: Eip1193Provider;
  provider: BrowserProvider | BitcoinProvider;
  chain: Chain;
}) {
  switch (chain) {
    case Chain.Bitcoin: {
      const { Psbt } = await import("bitcoinjs-lib");
      const { getToolboxByChain } = await import("@swapkit/toolboxes/utxo");
      const getToolbox = await getToolboxByChain(chain);
      const toolbox = getToolbox();

      let address = "";

      const getProvider: () => Promise<BitcoinProvider | undefined> = () =>
        new Promise((res) => res(provider as BitcoinProvider));

      const getAddressOptions: GetAddressOptions = {
        getProvider,
        payload: {
          purposes: [AddressPurpose.Payment],
          message: "Address for receiving and sending payments",
          network: { type: BitcoinNetworkType.Mainnet },
        },
        onFinish: (response: GetAddressResponse) => {
          if (!response.addresses[0]) throw new Error("No address found");
          address = response.addresses[0].address;
        },
        onCancel: () => {
          throw new Error("Request canceled");
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
            throw new Error("Signature canceled");
          },
        };

        await satsSignTransaction(signPsbtOptions);
        if (!signedPsbt) throw new SwapKitError("wallet_exodus_sign_transaction_error");
        return signedPsbt;
      }

      const transfer = (transferParams: UTXOTransferParams) => {
        return toolbox.transfer({ ...transferParams, signTransaction });
      };

      return { ...toolbox, transfer, address, getBalance: () => toolbox.getBalance(address) };
    }
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      if (!walletProvider) throw new Error("Requested web3 wallet is not installed");
      const { getProvider, getToolboxByChain } = await import("@swapkit/toolboxes/evm");

      const jsonRpcProvider = await getProvider(chain);
      const browserProvider = provider as BrowserProvider;

      await browserProvider.send("eth_requestAccounts", []);

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const toolbox = getToolboxByChain(chain)({ provider: jsonRpcProvider, signer });

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = toolbox.getNetworkParams();
          await switchEVMWalletNetwork(browserProvider, chain, networkParams);
        }
      } catch (_error) {
        throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
      }

      return { ...prepareNetworkSwitch({ toolbox, chain, provider: browserProvider }), address };
    }
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

export const exodusWallet = createWallet({
  name: "connectExodusWallet",
  walletType: WalletOption.EXODUS,
  supportedChains: [...EVMChains, Chain.Bitcoin],
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectExodusWallet(chains: Chain[], wallet: Wallet) {
      if (!wallet) throw new Error("Missing Exodus Wallet instance");
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const { BrowserProvider } = await import("ethers");

      const { providers } = wallet;

      await Promise.all(
        filteredChains.map(async (chain) => {
          const provider =
            chain === Chain.Bitcoin
              ? providers.bitcoin
              : new BrowserProvider(providers.ethereum, "any");

          const { address, ...walletMethods } = await getWalletMethods({
            chain,
            provider,
            walletProvider: providers.ethereum,
          });

          const disconnect = () =>
            provider.send("wallet_revokePermissions", [{ eth_accounts: {} }]);

          addChain({
            ...walletMethods,
            disconnect,
            chain,
            address,
            walletType: WalletOption.EXODUS,
          });
        }),
      );

      return true;
    },
});

export const EXODUS_SUPPORTED_CHAINS = getWalletSupportedChains(exodusWallet);
export * from "@passkeys/react";
export * from "@passkeys/core";
