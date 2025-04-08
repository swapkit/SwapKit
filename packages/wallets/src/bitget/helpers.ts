import {
  type AssetValue,
  Chain,
  ChainId,
  type EVMChain,
  SKConfig,
  SwapKitError,
  type WalletTxParams,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { TransferParams } from "@swapkit/toolboxes/cosmos";
import type { UTXOTransferParams } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import type { Eip1193Provider } from "ethers";

function cosmosTransfer() {
  return async ({ from, recipient, assetValue, memo }: TransferParams) => {
    const { getMsgSendDenom, createSigningStargateClient } = await import(
      "@swapkit/toolboxes/cosmos"
    );
    if (!(window.bitkeep && "keplr" in window.bitkeep)) {
      throw new SwapKitError("wallet_bitkeep_not_found");
    }

    const { keplr: wallet } = window.bitkeep;

    const offlineSigner = wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos);
    const cosmJS = await createSigningStargateClient(SKConfig.get("rpcUrls").GAIA, offlineSigner);

    const coins = [
      {
        denom: getMsgSendDenom(assetValue.symbol).toLowerCase(),
        amount: assetValue.getBaseValue("string"),
      },
    ];

    try {
      const { transactionHash } = await cosmJS.sendTokens(from, recipient, coins, 2, memo);
      return transactionHash;
    } catch (error) {
      throw new SwapKitError("core_transaction_failed", { error });
    }
  };
}

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

      const { Psbt } = await import("bitcoinjs-lib");
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const [address] = await wallet.requestAccounts();
      const toolbox = await getUtxoToolbox(Chain.Bitcoin);

      async function signTransaction(psbt: Psbt) {
        const signedPsbt = await wallet.signPsbt(psbt.toHex(), { autoFinalized: false });

        return Psbt.fromHex(signedPsbt);
      }

      function transfer(transferParams: UTXOTransferParams) {
        return toolbox.transfer({ ...transferParams, signTransaction });
      }

      return { ...toolbox, transfer, address };
    }

    case Chain.Cosmos: {
      if (!(bitget && "keplr" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }
      const { keplr: wallet } = bitget;

      await wallet.enable(ChainId.Cosmos);
      const accounts = await wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos).getAccounts();
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const toolbox = getCosmosToolbox(Chain.Cosmos);
      const [{ address }] = accounts;

      return { ...toolbox, address, transfer: cosmosTransfer() };
    }

    case Chain.Solana: {
      if (!(bitget && "solana" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const provider = bitget?.solana;

      const toolbox = getSolanaToolbox();
      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();

      const transfer = async ({
        recipient,
        assetValue,
        isProgramDerivedAddress,
        memo,
      }: WalletTxParams & { assetValue: AssetValue; isProgramDerivedAddress?: boolean }) => {
        const validateAddress = await toolbox.getAddressValidator();

        if (!(isProgramDerivedAddress || validateAddress(recipient))) {
          throw new SwapKitError("core_transaction_invalid_recipient_address");
        }
        const { PublicKey } = await import("@solana/web3.js");
        const fromPublicKey = new PublicKey(address);

        const connection = await toolbox.getConnection();
        const transaction = await toolbox.createSolanaTransaction({
          recipient,
          assetValue,
          memo,
          fromPublicKey,
          isProgramDerivedAddress,
        });

        const blockHash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockHash.blockhash;
        transaction.feePayer = fromPublicKey;

        const signedTransaction = await provider.signTransaction(transaction);

        return toolbox.broadcastTransaction(signedTransaction);
      };

      return { ...toolbox, transfer, address };
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
