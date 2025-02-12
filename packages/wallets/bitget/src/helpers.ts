import { PublicKey } from "@solana/web3.js";
import {
  type AssetValue,
  Chain,
  type ChainApis,
  ChainId,
  ChainToHexChainId,
  type EVMChain,
  SwapKitError,
  type WalletTxParams,
  getRPCUrl,
  pickEvmApiKey,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { TransferParams } from "@swapkit/toolbox-cosmos";
import type { AlchemyApiType, CovalentApiType, EthplorerApiType } from "@swapkit/toolbox-evm";
import type { Psbt, UTXOTransferParams } from "@swapkit/toolbox-utxo";
import type { Eip1193Provider } from "ethers";

export function cosmosTransfer(rpcUrl?: string) {
  return async ({ from, recipient, assetValue, memo }: TransferParams) => {
    const { getMsgSendDenom, createSigningStargateClient } = await import(
      "@swapkit/toolbox-cosmos"
    );
    if (!(window.bitkeep && "keplr" in window.bitkeep)) {
      throw new SwapKitError("wallet_bitkeep_not_found");
    }

    const { keplr: wallet } = window.bitkeep;

    const offlineSigner = wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos);
    const cosmJS = await createSigningStargateClient(
      rpcUrl || getRPCUrl(Chain.Cosmos),
      offlineSigner,
    );

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity:
export async function getWalletForChain({
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  rpcUrl,
  apis,
}: {
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  blockchairApiKey?: string;
  rpcUrl?: string;
  apis?: ChainApis;
}) {
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

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });

      const wallet = bitget.ethereum;

      const { getProvider } = await import("@swapkit/toolbox-evm");

      const evmWallet = await getWeb3WalletMethods({
        chain,
        apiKey,
        ethereumWindowProvider: wallet,
        api,
      });

      const [address]: [string, ...string[]] = await wallet.send("eth_requestAccounts", []);

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { ...evmWallet, getBalance, address };
    }

    case Chain.Bitcoin: {
      if (!(bitget && "unisat" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const api = apis?.[chain];

      const { unisat: wallet } = bitget;

      const { Psbt, BTCToolbox } = await import("@swapkit/toolbox-utxo");

      const [address] = await wallet.requestAccounts();
      const apiClient = typeof api === "object" && "getConfirmedBalance" in api ? api : undefined;

      const toolbox = BTCToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient });
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
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const api = apis?.[chain];

      const { keplr: wallet } = bitget;

      await wallet.enable(ChainId.Cosmos);
      const accounts = await wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos).getAccounts();
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { GaiaToolbox } = await import("@swapkit/toolbox-cosmos");
      const [{ address }] = accounts;

      return {
        address,
        ...GaiaToolbox({ server: typeof api === "string" ? api : undefined }),
        transfer: cosmosTransfer(rpcUrl),
      };
    }

    case Chain.Solana: {
      if (!(bitget && "solana" in bitget)) {
        throw new SwapKitError("wallet_bitkeep_not_found");
      }

      const { SOLToolbox } = await import("@swapkit/toolbox-solana");
      const provider = bitget?.solana;

      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();

      const toolbox = SOLToolbox({ rpcUrl });

      const transfer = async ({
        recipient,
        assetValue,
        isProgramDerivedAddress,
        memo,
      }: WalletTxParams & { assetValue: AssetValue; isProgramDerivedAddress?: boolean }) => {
        if (!(isProgramDerivedAddress || toolbox.validateAddress(recipient))) {
          throw new SwapKitError("core_transaction_invalid_recipient_address");
        }
        const fromPublicKey = new PublicKey(address);

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
  ethereumWindowProvider,
  chain,
  apiKey,
  api,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: EVMChain;
  apiKey?: string;
  api?: EthplorerApiType | CovalentApiType | AlchemyApiType;
}) => {
  const { getToolboxByChain } = await import("@swapkit/toolbox-evm");
  const { BrowserProvider } = await import("ethers");
  if (!ethereumWindowProvider) throw new SwapKitError("wallet_provider_not_found");

  const provider = new BrowserProvider(ethereumWindowProvider, "any");

  const toolbox = getToolboxByChain(chain)({
    provider,
    signer: await provider.getSigner(),
    apiKey,
    api,
  });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await switchEVMWalletNetwork(provider, ChainToHexChainId[chain], toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }

  return prepareNetworkSwitch({ toolbox, provider, chainId: ChainToHexChainId[chain] });
};
