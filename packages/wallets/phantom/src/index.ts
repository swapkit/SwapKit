import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  type AssetValue,
  Chain,
  type ChainApis,
  type ConnectWalletParams,
  SwapKitError,
  WalletOption,
  type WalletTxParams,
  filterSupportedChains,
  pickEvmApiKey,
  setRequestClientConfig,
} from "@swapkit/helpers";
import type { SolanaProvider } from "@swapkit/toolbox-solana";

export const PHANTOM_SUPPORTED_CHAINS = [Chain.Bitcoin, Chain.Ethereum, Chain.Solana] as const;
export type PhantomSupportedChains = (typeof PHANTOM_SUPPORTED_CHAINS)[number];

declare global {
  interface Window {
    phantom: {
      solana: SolanaProvider;
    };
  }
}

async function getWalletMethods({
  apis,
  chain,
  rpcUrl,
  covalentApiKey,
  ethplorerApiKey,
}: {
  apis?: ChainApis;
  rpcUrl?: string;
  chain: (typeof PHANTOM_SUPPORTED_CHAINS)[number];
  covalentApiKey?: string;
  ethplorerApiKey?: string;
}) {
  const phantom: any = window?.phantom;

  switch (chain) {
    case Chain.Bitcoin: {
      const provider = phantom?.bitcoin;
      if (!provider?.isPhantom) {
        throw new SwapKitError("wallet_phantom_not_found");
      }
      const [{ address }] = await provider.requestAccounts();

      const { getToolboxByChain } = await import("@swapkit/toolbox-utxo");
      const toolbox = getToolboxByChain(chain);

      return { ...toolbox({ rpcUrl }), address };
    }

    case Chain.Ethereum: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-evm");
      const { BrowserProvider } = await import("ethers");

      const api = apis?.[chain];

      const provider = new BrowserProvider(phantom?.ethereum, "any");
      const [address] = await provider.send("eth_requestAccounts", []);

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });
      const signer = await provider.getSigner();

      const toolbox = getToolboxByChain(chain)({ api, apiKey, signer, provider });

      return { ...toolbox, address };
    }

    case Chain.Solana: {
      const { createSolanaTokenTransaction, SOLToolbox } = await import("@swapkit/toolbox-solana");
      const provider = phantom?.solana;
      if (!provider?.isPhantom) {
        throw new SwapKitError("wallet_phantom_not_found");
      }

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

    default: {
      throw new SwapKitError("wallet_chain_not_supported", {
        wallet: WalletOption.PHANTOM,
        chain,
      });
    }
  }
}

function connectPhantom({
  addChain,
  config: { covalentApiKey, ethplorerApiKey, thorswapApiKey },
  rpcUrls,
}: ConnectWalletParams) {
  return async function connectPhantom(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      PHANTOM_SUPPORTED_CHAINS,
      WalletOption.PHANTOM,
    );

    async function connectChain(chain: PhantomSupportedChains) {
      const rpcUrl = rpcUrls[chain];
      const { address, ...methods } = await getWalletMethods({
        chain,
        covalentApiKey,
        ethplorerApiKey,
        rpcUrl,
      });

      addChain({
        ...methods,
        chain,
        address,
        walletType: WalletOption.PHANTOM,
        balance: [],
      });
    }

    try {
      for (const chain of supportedChains) {
        await connectChain(chain);
      }

      return true;
    } catch (error) {
      if (error instanceof SwapKitError) throw error;

      throw new SwapKitError("wallet_connection_rejected_by_user");
    }
  };
}

export const phantomWallet = { connectPhantom } as const;
