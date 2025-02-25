import {
  type AssetValue,
  Chain,
  SwapKitError,
  WalletOption,
  type WalletTxParams,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { SolanaProvider } from "@swapkit/toolboxes/solana";
import { getWalletSupportedChains } from "../helpers";

export const phantomWallet = createWallet({
  name: "connectPhantom",
  walletType: WalletOption.PHANTOM,
  supportedChains: [Chain.Bitcoin, Chain.Ethereum, Chain.Solana],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectPhantom(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      try {
        await Promise.all(
          filteredChains.map(async (chain) => {
            const { address, ...methods } = await getWalletMethods(chain);

            addChain({ ...methods, chain, address, walletType });
          }),
        );

        return true;
      } catch (error) {
        if (error instanceof SwapKitError) throw error;

        throw new SwapKitError("wallet_connection_rejected_by_user", error);
      }
    },
});

export const PHANTOM_SUPPORTED_CHAINS = getWalletSupportedChains(phantomWallet);
export type PhantomSupportedChain = (typeof PHANTOM_SUPPORTED_CHAINS)[number];

declare global {
  interface Window {
    phantom: {
      solana: SolanaProvider;
    };
  }
}

async function getWalletMethods(chain: PhantomSupportedChain) {
  const phantom: any = window?.phantom;

  switch (chain) {
    case Chain.Bitcoin: {
      const provider = phantom?.bitcoin;
      if (!provider?.isPhantom) {
        throw new SwapKitError("wallet_phantom_not_found");
      }

      const { getToolboxByChain } = await import("@swapkit/toolboxes/utxo");
      const [{ address }] = await provider.requestAccounts();

      const toolbox = getToolboxByChain(chain)();

      return { ...toolbox, address };
    }

    case Chain.Ethereum: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/evm");
      const { BrowserProvider } = await import("ethers");

      const provider = new BrowserProvider(phantom?.ethereum, "any");
      const [address] = await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const toolbox = getToolboxByChain(chain)({ signer, provider });

      return { ...toolbox, address };
    }

    case Chain.Solana: {
      const { createSolanaTokenTransaction, SOLToolbox } = await import(
        "@swapkit/toolboxes/solana"
      );
      const provider = phantom?.solana;
      if (!provider?.isPhantom) {
        throw new SwapKitError("wallet_phantom_not_found");
      }

      const providerConnection = await provider.connect();
      const address: string = providerConnection.publicKey.toString();
      const toolbox = SOLToolbox();

      const transfer = async ({
        recipient,
        assetValue,
        isProgramDerivedAddress,
      }: WalletTxParams & { assetValue: AssetValue; isProgramDerivedAddress?: boolean }) => {
        const { PublicKey, Transaction, SystemProgram } = await import("@solana/web3.js");
        const validateAddress = await toolbox.getAddressValidator();
        if (!(isProgramDerivedAddress || validateAddress(recipient))) {
          throw new SwapKitError("core_transaction_invalid_recipient_address");
        }

        const fromPubkey = new PublicKey(address);
        const amount = assetValue.getBaseValue("number");
        const connection = await toolbox.getConnection();

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
                connection,
                decimals: assetValue.decimal as number,
                from: fromPubkey,
                recipient,
                tokenAddress: assetValue.address,
              })
            : undefined;

        if (!transaction) {
          throw new SwapKitError("core_transaction_invalid_sender_address");
        }

        const blockHash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockHash.blockhash;
        transaction.feePayer = fromPubkey;

        const signedTransaction = await provider.signTransaction(transaction);

        const txid = await connection.sendRawTransaction(signedTransaction.serialize());

        return txid;
      };

      return { ...toolbox, transfer, address };
    }

    default: {
      throw new SwapKitError("wallet_chain_not_supported", { wallet: WalletOption.PHANTOM, chain });
    }
  }
}
