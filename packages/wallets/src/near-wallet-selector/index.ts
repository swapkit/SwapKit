import type { Wallet, WalletModuleFactory } from "@near-wallet-selector/core";
import "@near-wallet-selector/modal-ui-js/styles.css";
import type { Transaction } from "@near-js/transactions";
import { Chain, filterSupportedChains, SKConfig, SwapKitError, WalletOption } from "@swapkit/helpers";
import { getNearToolbox } from "@swapkit/toolboxes/near";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

function createNearSigner(wallet: Wallet) {
  return {
    getAddress: async () => {
      const accounts = await wallet.getAccounts();
      const accountId = accounts[0]?.accountId;

      if (!accountId) {
        throw new SwapKitError("wallet_connection_rejected_by_user");
      }

      return accountId;
    },

    getPublicKey: () => {
      throw new SwapKitError("wallet_near_method_not_supported");
    },
    signAndSendTransactions: async (transactions: { transactions: Transaction[] }) => {
      const result = await wallet.signAndSendTransactions(transactions);
      return result?.[0]?.transaction_outcome.id || "";
    },

    signDelegateAction: () => {
      throw new SwapKitError("wallet_near_method_not_supported");
    },

    signNep413Message: () => {
      throw new SwapKitError("wallet_near_method_not_supported");
    },

    signTransaction: (params: Transaction) => {
      if (!wallet.signTransaction) {
        throw new SwapKitError("wallet_near_method_not_supported");
      }
      return wallet.signTransaction(params);
    },
  };
}

function waitForWalletSelection(selector: any, modal: any) {
  return new Promise<void>((resolve) => {
    const subscription = selector.store.observable.subscribe((state: any) => {
      if (state.selectedWalletId) {
        subscription.unsubscribe();
        modal.hide();
        resolve();
      }
    });

    modal.show();
  });
}

async function getWalletMethods(walletFactories?: WalletModuleFactory[]) {
  const { setupWalletSelector } = await import("@near-wallet-selector/core");
  const { setupModal } = await import("@near-wallet-selector/modal-ui-js");

  const contractId = SKConfig.get("integrations")?.nearWalletSelector?.contractId || "";
  const selector = await setupWalletSelector({ modules: [...(walletFactories || [])], network: "mainnet" });

  const isSignedIn = selector.isSignedIn();

  if (!isSignedIn) {
    // Only show modal if not already connected
    const modal = setupModal(selector, { contractId, description: "Connect your NEAR wallet to SwapKit" });

    await waitForWalletSelection(selector, modal);
  }

  const wallet = await selector.wallet();
  const signer = createNearSigner(wallet);
  const toolbox = await getNearToolbox({ signer });
  const address = await signer.getAddress();

  const disconnect = async () => {
    try {
      await wallet.signOut();
    } catch (error) {
      throw new SwapKitError("wallet_connection_rejected_by_user", error);
    }
  };

  return { ...toolbox, address, disconnect };
}

export const walletSelectorWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectWalletSelector(chains: Chain[], walletFactories?: WalletModuleFactory[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      if (filteredChains.length === 0) {
        throw new SwapKitError("wallet_chain_not_supported", {
          chain: chains[0],
          wallet: WalletOption.WALLET_SELECTOR,
        });
      }

      const walletMethods = await getWalletMethods(walletFactories);

      addChain({ ...walletMethods, balance: [], chain: Chain.Near, walletType });

      return true;
    },
  name: "connectWalletSelector",
  supportedChains: [Chain.Near],
  walletType: WalletOption.WALLET_SELECTOR,
});

export const WALLET_SELECTOR_SUPPORTED_CHAINS = getWalletSupportedChains(walletSelectorWallet);
