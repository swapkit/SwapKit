import {
  Chain,
  ChainId,
  type EVMChain,
  SwapKitError,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import { Psbt } from "bitcoinjs-lib";
import type { Eip1193Provider } from "ethers";

export async function getWalletMethods(chain: Chain) {
  const bitget = window.bitkeep;

  switch (chain) {
    case Chain.Ethereum:
    case Chain.Base:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain: {
      if (!(bitget && "ethereum" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const wallet = bitget.ethereum;

      const [address]: [string] = await wallet.send("eth_requestAccounts", []);
      const evmWallet = await getWeb3WalletMethods({ chain, walletProvider: wallet });

      return { ...evmWallet, address };
    }

    case Chain.Bitcoin: {
      if (!(bitget && "unisat" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }
      const { unisat: wallet } = bitget;

      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const [address] = await wallet.requestAccounts();

      async function signTransaction(psbt: Psbt) {
        const signedPsbt = await wallet.signPsbt(psbt.toHex(), { autoFinalized: false });

        return Psbt.fromHex(signedPsbt);
      }

      const signer = {
        getAddress: () => Promise.resolve(address),
        signTransaction,
      };

      const toolbox = await getUtxoToolbox(Chain.Bitcoin, { signer });

      return { ...toolbox, address };
    }

    case Chain.Cosmos: {
      if (!(bitget && "keplr" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }
      const { keplr: wallet } = bitget;

      await wallet.enable(ChainId.Cosmos);
      const offlineSigner = wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos);
      const accounts = await offlineSigner.getAccounts();
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const [{ address }] = accounts;

      const signer = {
        ...offlineSigner,
        getAddress: () => Promise.resolve(address),
        signTransaction: async () => Promise.resolve({} as any),
      };

      const toolbox = getCosmosToolbox(Chain.Cosmos, {
        signer,
      });

      return { ...toolbox, address };
    }

    case Chain.Solana: {
      if (!(bitget && "solana" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const provider = bitget?.solana;

      const toolbox = getSolanaToolbox({ signer: provider });
      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();

      return { ...toolbox, address };
    }

    default:
      throw new SwapKitError("wallet_chain_not_supported");
  }
}

export const getWeb3WalletMethods = async ({
  chain,
  walletProvider,
}: { walletProvider?: Eip1193Provider; chain: EVMChain }) => {
  const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
  const { BrowserProvider } = await import("ethers");
  if (!walletProvider) throw new SwapKitError("wallet_provider_not_found");

  const provider = new BrowserProvider(walletProvider, "any");
  const signer = await provider.getSigner();
  const toolbox = await getEvmToolbox(chain, { provider, signer });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await switchEVMWalletNetwork(provider, chain, toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }

  return prepareNetworkSwitch({ chain, toolbox, provider });
};
