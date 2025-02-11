import type { Wallet } from "@passkeys/core";
import {
  type AddChainType,
  Chain,
  EVMChains,
  SwapKitError,
  WalletOption,
  filterSupportedChains,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import { type NonETHToolbox, getProvider, getToolboxByChain } from "@swapkit/toolbox-evm";
import { BTCToolbox, Psbt, type UTXOTransferParams } from "@swapkit/toolbox-utxo";
import { BrowserProvider, type Eip1193Provider } from "ethers";
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

export const EXODUS_SUPPORTED_CHAINS = [...EVMChains, Chain.Bitcoin] as const;

export const getWalletMethods = async ({
  walletProvider,
  provider,
  chain,
}: {
  walletProvider?: Eip1193Provider;
  provider: BrowserProvider | BitcoinProvider;
  chain: Chain;
}) => {
  switch (chain) {
    case Chain.Bitcoin: {
      const toolbox = BTCToolbox();

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
          if (!response.addresses[0]) throw Error("No address found");
          address = response.addresses[0].address;
        },
        onCancel: () => {
          throw Error("Request canceled");
        },
      };

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
            throw Error("Signature canceled");
          },
        };

        await satsSignTransaction(signPsbtOptions);
        if (!signedPsbt) throw new SwapKitError("wallet_exodus_sign_transaction_error");
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
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      if (!walletProvider) throw new Error("Requested web3 wallet is not installed");

      const jsonRpcProvider = getProvider(chain);
      const browserProvider = provider as BrowserProvider;

      await browserProvider.send("eth_requestAccounts", []);

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const toolbox = getToolboxByChain(chain)({ provider: jsonRpcProvider, signer });

      try {
        if (chain !== Chain.Ethereum) {
          const networkParams = (toolbox as NonETHToolbox).getNetworkParams();
          await switchEVMWalletNetwork(browserProvider, chain, networkParams);
        }
      } catch (_error) {
        throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
      }

      return {
        address,
        ...prepareNetworkSwitch<typeof toolbox>({ toolbox, chain, provider: browserProvider }),
      };
    }
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};

function connectExodusWallet(addChain: AddChainType) {
  return async function connectExodusWallet(chains: Chain[], wallet: Wallet) {
    if (!wallet) throw new Error("Missing Exodus Wallet instance");

    const supportedChains = filterSupportedChains(
      chains,
      EXODUS_SUPPORTED_CHAINS,
      WalletOption.EXODUS,
    );

    const { providers } = wallet;

    const promises = supportedChains.map(async (chain) => {
      const provider =
        chain === Chain.Bitcoin
          ? providers.bitcoin
          : new BrowserProvider(providers.ethereum, "any");

      const { address, ...walletMethods } = await getWalletMethods({
        chain,
        provider,
        walletProvider: providers.ethereum,
      });

      const getBalance = async (potentialScamFilter = true) =>
        walletMethods.getBalance(address, potentialScamFilter);

      const disconnect = () => provider.send("wallet_revokePermissions", [{ eth_accounts: {} }]);

      addChain({
        ...walletMethods,
        disconnect,
        chain,
        address,
        getBalance,
        balance: [],
        walletType: WalletOption.EXODUS,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const exodusWallet = { connectExodusWallet } as const;

export * from "@passkeys/react";
export * from "@passkeys/core";
