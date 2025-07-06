import {
  Chain,
  ChainId,
  type EVMChain,
  SwapKitError,
  prepareNetworkSwitch,
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
        Chain.Ethereum,
        Chain.Base,
        Chain.Avalanche,
        Chain.Arbitrum,
        Chain.Optimism,
        Chain.Polygon,
        Chain.BinanceSmartChain,
      ),
      async () => {
        if (!(bitget && "ethereum" in bitget)) {
          throw new SwapKitError("wallet_bitkeep_not_found");
        }

        const wallet = bitget.ethereum;

        const [address]: [string] = await wallet.send("eth_requestAccounts", []);
        const evmWallet = await getWeb3WalletMethods({
          chain: chain as EVMChain,
          walletProvider: wallet,
        });

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

      const signer = {
        getAddress: () => Promise.resolve(address),
        signTransaction,
      };

      const toolbox = await getUtxoToolbox(Chain.Bitcoin, { signer });

      return { ...toolbox, address };
    })
    .with(Chain.Cosmos, async () => {
      if (!(bitget && "keplr" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }
      const { keplr: wallet } = bitget;

      await wallet.enable(ChainId.Cosmos);
      const offlineSigner = wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos);
      const accounts = await offlineSigner.getAccounts();
      if (!accounts?.[0])
        throw new SwapKitError("wallet_bitkeep_no_accounts", { chain: Chain.Cosmos });

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
    })
    .with(Chain.Solana, async () => {
      if (!(bitget && "solana" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const provider = bitget?.solana;

      const toolbox = getSolanaToolbox({ signer: provider });
      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();

      return { ...toolbox, address };
    })
    .with(Chain.Tron, async () => {
      if (!(bitget && "tronLink" in bitget && "tronWeb" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { createTronToolbox } = await import("@swapkit/toolboxes/tron");
      const { tronLink, tronWeb } = bitget;

      // Request account access
      const account = await tronLink.request({ method: "tron_requestAccounts" });
      if (!account?.base58) {
        throw new SwapKitError("wallet_bitkeep_no_accounts", { chain: Chain.Tron });
      }

      const address = account.base58;

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
    throw new SwapKitError("wallet_bitkeep_failed_to_switch_network", { chain });
  }

  return prepareNetworkSwitch({ chain, toolbox, provider });
};
