import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  type AssetValue,
  Chain,
  ChainId,
  ChainToHexChainId,
  type EVMChain,
  SwapKitError,
  type WalletTxParams,
  addEVMWalletNetwork,
  getRPCUrl,
  prepareNetworkSwitch,
} from "@swapkit/helpers";
import type { GaiaToolbox } from "@swapkit/toolbox-cosmos";
import type { Eip1193Provider } from "@swapkit/toolbox-evm";
import type { SOLToolbox } from "@swapkit/toolbox-solana";
import type { BTCToolbox, Psbt, UTXOTransferParams } from "@swapkit/toolbox-utxo";

const cosmosTransfer =
  (rpcUrl?: string) =>
  async ({ from, recipient, amount, asset, memo }: any) => {
    if (!(window.bitkeep && "keplr" in window.bitkeep)) {
      throw new Error("No cosmos bitkeep found");
    }

    const { keplr: wallet } = window.bitkeep;
    const offlineSigner = wallet?.getOfflineSignerOnlyAmino(ChainId.Cosmos);

    const { createSigningStargateClient } = await import("@swapkit/toolbox-cosmos");
    const cosmJS = await createSigningStargateClient(
      rpcUrl || getRPCUrl(Chain.Cosmos),
      offlineSigner,
    );

    const coins = [
      { denom: asset?.symbol === "MUON" ? "umuon" : "uatom", amount: amount.amount().toString() },
    ];

    const { transactionHash } = await cosmJS.sendTokens(from, recipient, coins, 1.6, memo);
    return transactionHash;
  };

export const getWalletForChain = async ({
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  rpcUrl,
  api,
}: {
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  blockchairApiKey?: string;
  rpcUrl?: string;
  api?: any;
}): Promise<
  (
    | ReturnType<typeof GaiaToolbox>
    | Awaited<ReturnType<typeof getWeb3WalletMethods>>
    | ReturnType<typeof BTCToolbox>
    | ReturnType<typeof SOLToolbox>
  ) & { address: string }
> => {
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
        throw new Error("No bitkeep found");
      }

      const wallet = bitget.ethereum;

      const { getProvider } = await import("@swapkit/toolbox-evm");

      const evmWallet = await getWeb3WalletMethods({
        chain,
        ethplorerApiKey,
        covalentApiKey,
        ethereumWindowProvider: wallet,
      });

      const [address]: [string, ...string[]] = await wallet.send("eth_requestAccounts", []);

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { ...evmWallet, getBalance, address };
    }

    case Chain.Bitcoin: {
      if (!(bitget && "unisat" in bitget)) {
        throw new Error("No bitcoin bitkeep found");
      }
      const { unisat: wallet } = bitget;

      const { Psbt, BTCToolbox } = await import("@swapkit/toolbox-utxo");

      const [address] = await wallet.requestAccounts();

      const toolbox = BTCToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient: api });
      const signTransaction = async (psbt: Psbt) => {
        const signedPsbt = await wallet.signPsbt(psbt.toHex(), { autoFinalized: false });

        return Psbt.fromHex(signedPsbt);
      };

      const transfer = (transferParams: UTXOTransferParams) => {
        return toolbox.transfer({ ...transferParams, signTransaction });
      };

      return { ...toolbox, transfer, address };
    }

    case Chain.Cosmos: {
      if (!(bitget && "keplr" in bitget)) {
        throw new Error("No bitcoin bitkeep found");
      }
      const { keplr: wallet } = bitget;

      await wallet.enable(ChainId.Cosmos);
      const accounts = await wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos).getAccounts();
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { GaiaToolbox } = await import("@swapkit/toolbox-cosmos");
      const [{ address }] = accounts;

      return {
        address,
        ...GaiaToolbox({ server: api }),
        transfer: cosmosTransfer(rpcUrl),
      };
    }

    case Chain.Solana: {
      if (!(bitget && "solana" in bitget)) {
        throw new Error("No solana bitkeep found");
      }

      const { createSolanaTokenTransaction, SOLToolbox } = await import("@swapkit/toolbox-solana");
      const provider = bitget?.solana;

      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();

      const toolbox = SOLToolbox({ rpcUrl });

      const transfer = async ({
        recipient,
        assetValue,
        isProgramDerivedAddress,
      }: WalletTxParams & { assetValue: AssetValue; isProgramDerivedAddress?: boolean }) => {
        if (!(isProgramDerivedAddress || toolbox.validateAddress(recipient))) {
          throw new SwapKitError("core_transaction_invalid_recipient_address");
        }

        const fromPubkey = new PublicKey(address);

        const amount = assetValue.getBaseValue("number");

        const transaction = assetValue.isGasAsset
          ? new Transaction().add(
              SystemProgram.transfer({
                fromPubkey,
                lamports: amount,
                toPubkey: new PublicKey(recipient),
              }),
            )
          : assetValue.address
            ? await createSolanaTokenTransaction({
                amount,
                connection: toolbox.connection,
                decimals: assetValue.decimal as number,
                from: fromPubkey,
                recipient,
                tokenAddress: assetValue.address,
              })
            : undefined;

        if (!transaction) {
          throw new SwapKitError("core_transaction_invalid_sender_address");
        }

        const blockHash = await toolbox.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockHash.blockhash;
        transaction.feePayer = fromPubkey;

        const signedTransaction = await provider.signTransaction(transaction);

        const txid = await toolbox.connection.sendRawTransaction(signedTransaction.serialize());

        return txid;
      };

      return { ...toolbox, transfer, address };
    }

    default:
      throw new Error(`No wallet for chain ${chain}`);
  }
};

export const getWeb3WalletMethods = async ({
  ethereumWindowProvider,
  chain,
  covalentApiKey,
  ethplorerApiKey,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: EVMChain;
  covalentApiKey?: string;
  ethplorerApiKey?: string;
}) => {
  const { getToolboxByChain, BrowserProvider } = await import("@swapkit/toolbox-evm");
  if (!ethereumWindowProvider) throw new Error("Requested web3 wallet is not installed");

  if (
    (chain !== Chain.Ethereum && !covalentApiKey) ||
    (chain === Chain.Ethereum && !ethplorerApiKey)
  ) {
    throw new SwapKitError({
      errorKey: "wallet_missing_api_key",
      info: {
        missingKey: chain === Chain.Ethereum ? "ethplorerApiKey" : "covalentApiKey",
        chain,
      },
    });
  }

  const provider = new BrowserProvider(ethereumWindowProvider, "any");

  const toolbox = getToolboxByChain(chain)({
    provider,
    signer: await provider.getSigner(),
    ethplorerApiKey: ethplorerApiKey as string,
    covalentApiKey: covalentApiKey as string,
  });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await addEVMWalletNetwork(provider, toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }

  return prepareNetworkSwitch({ toolbox, provider, chainId: ChainToHexChainId[chain] });
};
