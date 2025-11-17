import {
  Chain,
  type EVMChain,
  GAIAConfig,
  prepareNetworkSwitch,
  SwapKitError,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { TronTransaction } from "@swapkit/toolboxes/tron";
import { Psbt } from "bitcoinjs-lib";
import type { Eip1193Provider } from "ethers";

export async function getWalletMethods(chain: Chain) {
  const { match, P } = await import("ts-pattern");
  const bitget = window.bitkeep;

  return match(chain)
    .with(
      P.union(
        Chain.Arbitrum,
        Chain.Aurora,
        Chain.Avalanche,
        Chain.Base,
        Chain.Berachain,
        Chain.BinanceSmartChain,
        Chain.Ethereum,
        Chain.Gnosis,
        Chain.Optimism,
        Chain.Polygon,
        Chain.XLayer,
      ),
      async () => {
        if (!(bitget && "ethereum" in bitget)) {
          throw new SwapKitError("wallet_bitkeep_not_found");
        }

        const wallet = bitget.ethereum;

        const [address]: [string] = await wallet.send("eth_requestAccounts", []);
        const evmWallet = await getWeb3WalletMethods({ chain: chain as EVMChain, walletProvider: wallet });

        return { ...evmWallet, address };
      },
    )
    .with(Chain.Bitcoin, async () => {
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

      const signer = { getAddress: () => Promise.resolve(address), signTransaction };

      const toolbox = await getUtxoToolbox(Chain.Bitcoin, { signer });

      return { ...toolbox, address };
    })
    .with(Chain.Cosmos, async () => {
      if (!(bitget && "keplr" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }
      const { keplr: wallet } = bitget;

      await wallet.enable(GAIAConfig.chainId);
      const offlineSigner = wallet.getOfflineSignerOnlyAmino(GAIAConfig.chainId);
      const accounts = await offlineSigner.getAccounts();
      if (!accounts?.[0]) throw new SwapKitError("wallet_bitkeep_no_accounts", { chain: Chain.Cosmos });

      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const [{ address }] = accounts;

      const signer = {
        ...offlineSigner,
        getAddress: () => Promise.resolve(address),
        signTransaction: async () => Promise.resolve({} as any),
      };

      const toolbox = await getCosmosToolbox(Chain.Cosmos, { signer });

      return { ...toolbox, address };
    })
    .with(Chain.Solana, async () => {
      if (!(bitget && "solana" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const provider = bitget?.solana;

      // Connect to get the public key
      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();

      // Create a proper signer object that wraps the provider
      const signer = { ...provider, getAddress: async () => address, publicKey: providerConnection.publicKey };

      const toolbox = await getSolanaToolbox({ signer });

      return { ...toolbox, address };
    })
    .with(Chain.Tron, async () => {
      if (!(bitget && "tronLink" in bitget && "tronWeb" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { createTronToolbox } = await import("@swapkit/toolboxes/tron");
      const { tronLink, tronWeb } = bitget;

      // Request account access
      const response = await tronLink.request({ method: "tron_requestAccounts" });

      // Check if the request was successful
      if (response.code !== 200) {
        throw new SwapKitError("wallet_connection_rejected_by_user", {
          message: response.message || "User rejected connection",
        });
      }

      // After successful approval, the address should be available in tronWeb.defaultAddress
      const address = tronWeb.defaultAddress?.base58;

      if (!address) {
        throw new SwapKitError("wallet_bitkeep_no_accounts", { chain: Chain.Tron });
      }

      // Create signer compatible with TronSigner interface
      const signer = {
        getAddress: () => Promise.resolve(address),
        signTransaction: async (transaction: TronTransaction) => {
          const signedTx = await tronWeb.trx.sign(transaction);
          return signedTx;
        },
      };

      const toolbox = await createTronToolbox({ signer });

      return { ...toolbox, address };
    })
    .otherwise(() => {
      throw new SwapKitError("wallet_chain_not_supported");
    });
}

export const getWeb3WalletMethods = async ({
  chain,
  walletProvider,
}: {
  walletProvider?: Eip1193Provider;
  chain: EVMChain;
}) => {
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
  } catch {
    throw new SwapKitError("wallet_bitkeep_failed_to_switch_network", { chain });
  }

  return prepareNetworkSwitch({ chain, provider, toolbox });
};
