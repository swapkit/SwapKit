import type { Wallet } from "@passkeys/core";
import {
  Chain,
  type ChainApis,
  ChainToHexChainId,
  type ConnectWalletParams,
  EVMChains,
  WalletOption,
  filterSupportedChains,
  pickEvmApiKey,
  prepareNetworkSwitch,
  setRequestClientConfig,
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
  ethereumWindowProvider,
  walletProvider,
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  rpcUrl,
  apis,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  walletProvider: BrowserProvider | BitcoinProvider;
  chain: Chain;
  covalentApiKey?: string;
  ethplorerApiKey?: string;
  blockchairApiKey?: string;
  rpcUrl?: string;
  apis?: ChainApis;
}) => {
  switch (chain) {
    case Chain.Bitcoin: {
      const api = apis?.[chain];

      const toolbox = BTCToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient: api });

      let address = "";

      const getProvider: () => Promise<BitcoinProvider | undefined> = () =>
        new Promise((res) => res(walletProvider as BitcoinProvider));

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
              {
                address: address,
                signingIndexes: psbt.txInputs.map((_, index) => index),
              },
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
      if (!ethereumWindowProvider) throw new Error("Requested web3 wallet is not installed");

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });
      const provider = getProvider(chain);
      const browserProvider = walletProvider as BrowserProvider;

      await browserProvider.send("eth_requestAccounts", []);

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const toolbox = getToolboxByChain(chain)({ api, apiKey, provider, signer });

      try {
        chain !== Chain.Ethereum &&
          (await switchEVMWalletNetwork(
            browserProvider,
            ChainToHexChainId[chain],
            (toolbox as NonETHToolbox).getNetworkParams(),
          ));
      } catch (_error) {
        throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
      }

      return {
        address,
        ...prepareNetworkSwitch<typeof toolbox>({
          toolbox,
          chainId: ChainToHexChainId[chain],
          provider: browserProvider,
        }),
      };
    }
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};

function connectExodusWallet({
  addChain,
  config: { covalentApiKey, ethplorerApiKey, thorswapApiKey },
}: ConnectWalletParams) {
  return async function connectExodusWallet(chains: Chain[], wallet: Wallet) {
    if (!wallet) throw new Error("Missing Exodus Wallet instance");
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      EXODUS_SUPPORTED_CHAINS,
      WalletOption.EXODUS,
    );

    const { providers } = wallet;

    const promises = supportedChains.map(async (chain) => {
      const walletProvider =
        chain === Chain.Bitcoin
          ? providers.bitcoin
          : new BrowserProvider(providers.ethereum, "any");

      const { address, ...walletMethods } = await getWalletMethods({
        chain,
        ethplorerApiKey,
        covalentApiKey,
        ethereumWindowProvider: providers.ethereum,
        walletProvider,
      });

      const getBalance = async (potentialScamFilter = true) =>
        walletMethods.getBalance(address, potentialScamFilter);

      const disconnect = () =>
        walletProvider.send("wallet_revokePermissions", [
          {
            eth_accounts: {},
          },
        ]);

      addChain({
        ...walletMethods,
        disconnect,
        chain,
        address,
        getBalance,
        balance: [],
        walletType: WalletOption.EXODUS,
      });
      return;
    });

    await Promise.all(promises);

    return true;
  };
}

export const exodusWallet = { connectExodusWallet } as const;

export * from "@passkeys/react";
export * from "@passkeys/core";
