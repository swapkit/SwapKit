import { setupBitgetWallet } from "@near-wallet-selector/bitget-wallet";
import { setupWalletSelector, type Wallet } from "@near-wallet-selector/core";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMeteorWalletApp } from "@near-wallet-selector/meteor-wallet-app";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import "@near-wallet-selector/modal-ui-js/styles.css";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupOKXWallet } from "@near-wallet-selector/okx-wallet";
import { Chain, filterSupportedChains, SKConfig, SwapKitError, WalletOption } from "@swapkit/helpers";
import { getNearToolbox } from "@swapkit/toolboxes/near";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import type { Transaction } from "near-api-js/lib/transaction";

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

async function getWalletMethods() {
  const contractId = SKConfig.get("integrations")?.nearWalletSelector?.contractId || "";
  const selector = await setupWalletSelector({
    modules: [
      setupBitgetWallet(),
      setupHotWallet(),
      setupMeteorWallet(),
      setupMeteorWalletApp({ contractId }),
      setupMyNearWallet(),
      setupNearMobileWallet(),
      setupNightly(),
      setupOKXWallet(),
    ],
    network: "mainnet",
  });

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
    async function connectWalletSelector(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      if (filteredChains.length === 0) {
        throw new SwapKitError("wallet_chain_not_supported", {
          chain: chains[0],
          wallet: WalletOption.WALLET_SELECTOR,
        });
      }

      try {
        const walletMethods = await getWalletMethods();

        addChain({ ...walletMethods, balance: [], chain: Chain.Near, walletType });

        return true;
      } catch (error) {
        if (error instanceof SwapKitError) throw error;
        throw new SwapKitError("wallet_connection_rejected_by_user", error);
      }
    },
  name: "connectWalletSelector",
  supportedChains: [Chain.Near],
  walletType: WalletOption.WALLET_SELECTOR,
});

export const WALLET_SELECTOR_SUPPORTED_CHAINS = getWalletSupportedChains(walletSelectorWallet);
