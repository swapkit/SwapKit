import type { Wallet } from "@passkeys/core";
import { Transaction } from "@solana/web3.js";
import {
  type AssetValue,
  Chain,
  type ChainApis,
  ChainToHexChainId,
  type ConnectWalletParams,
  EVMChains,
  SwapKitError,
  WalletOption,
  type WalletTxParams,
  filterSupportedChains,
  getRPCUrl,
  pickEvmApiKey,
  prepareNetworkSwitch,
  setRequestClientConfig,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import { type NonETHToolbox, getProvider, getToolboxByChain } from "@swapkit/toolbox-evm";
import { SOLToolbox } from "@swapkit/toolbox-solana";
import { BTCToolbox, Psbt, type UTXOTransferParams } from "@swapkit/toolbox-utxo";
import { BrowserProvider } from "ethers";
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

export const EXODUS_SUPPORTED_CHAINS = [...EVMChains, Chain.Bitcoin, Chain.Solana] as const;

export const getWalletMethods = async ({
  wallet,
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  rpcUrl,
  apis,
}: {
  wallet: Wallet;
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
      const walletProvider = await wallet.getProvider("bitcoin");

      const toolbox = BTCToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient: api });

      let address = "";

      const getProvider: () => Promise<BitcoinProvider | undefined> = () =>
        new Promise((res) => res(walletProvider || undefined));

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
          from: address,
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
      const ethereumWindowProvider = await wallet.getProvider("ethereum");
      if (!ethereumWindowProvider) throw new Error("Requested web3 wallet is not installed");

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });
      const provider = getProvider(chain);
      const browserProvider = new BrowserProvider(ethereumWindowProvider, "any");

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
    case Chain.Solana: {
      const walletProvider = await wallet.getProvider("solana");
      if (!walletProvider) throw new Error("Requested web3 wallet is not installed");

      const signTransaction = async (transaction: Transaction) => {
        const serialized = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        const signed = await walletProvider.signTransaction(serialized);
        return Transaction.from(signed.serialize());
      };

      const publicKey = walletProvider.publicKey;
      if (!publicKey) throw new SwapKitError("wallet_connection_rejected_by_user");
      const address = publicKey.toString();

      // Initialize Solana toolbox
      const toolbox = SOLToolbox({
        rpcUrl: rpcUrl || getRPCUrl(Chain.Solana),
      });

      const transfer = async ({
        recipient,
        assetValue,
        isProgramDerivedAddress,
        memo,
      }: WalletTxParams & { assetValue: AssetValue; isProgramDerivedAddress?: boolean }) => {
        if (!(isProgramDerivedAddress || toolbox.validateAddress(recipient))) {
          throw new SwapKitError("core_transaction_invalid_recipient_address");
        }
        const fromPublicKey = publicKey;

        const transaction = await toolbox.createSolanaTransaction({
          recipient,
          assetValue,
          memo,
          fromPublicKey,
          isProgramDerivedAddress,
        });

        const blockHash = await toolbox.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockHash.blockhash;
        transaction.feePayer = fromPublicKey;

        const signedTransaction = await signTransaction(transaction);

        return toolbox.broadcastTransaction(signedTransaction);
      };

      if (!address) throw new Error("No Solana address found");

      // Create wallet methods that delegate to Exodus provider

      return { ...toolbox, transfer, address };
    }
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};

function connectExodusWallet({
  addChain,
  config: { covalentApiKey, ethplorerApiKey, thorswapApiKey, blockchairApiKey },
}: ConnectWalletParams) {
  return async function connectExodusWallet(chains: Chain[], wallet: Wallet) {
    if (!wallet) throw new Error("Missing Exodus Wallet instance");
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      EXODUS_SUPPORTED_CHAINS,
      WalletOption.EXODUS,
    );

    const promises = supportedChains.map(async (chain) => {
      try {
        const { address, ...walletMethods } = await getWalletMethods({
          wallet,
          chain,
          ethplorerApiKey,
          covalentApiKey,
          blockchairApiKey,
        });

        const getBalance = async (potentialScamFilter = true) =>
          walletMethods.getBalance(address, potentialScamFilter);

        const disconnect = wallet.disconnect;

        addChain({
          ...walletMethods,
          disconnect,
          chain,
          address,
          getBalance,
          balance: [],
          walletType: WalletOption.EXODUS,
        });
      } catch (error) {
        console.error(`Failed to connect ${chain}:`, error);
      }
    });

    await Promise.all(promises);

    return true;
  };
}

export const exodusWallet = { connectExodusWallet } as const;

export * from "@passkeys/react";
export * from "@passkeys/core";
