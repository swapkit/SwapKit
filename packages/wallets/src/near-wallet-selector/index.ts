import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupSender } from "@near-wallet-selector/sender";
import { Chain, filterSupportedChains, SKConfig, SwapKitError, WalletOption } from "@swapkit/helpers";
import { getNearToolbox, type NearSigner } from "@swapkit/toolboxes/near";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

function createNearSigner(wallet: any): NearSigner {
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

    signMessage: (params: any) => {
      if (!wallet.signMessage) {
        throw new SwapKitError("wallet_near_method_not_supported");
      }
      return wallet.signMessage(params);
    },

    signNep413Message: () => {
      throw new SwapKitError("wallet_near_method_not_supported");
    },

    signTransaction: (params: any) => {
      if (!wallet.signAndSendTransaction) {
        throw new SwapKitError("wallet_near_method_not_supported");
      }
      return wallet.signAndSendTransaction(params);
    },

    signTransactions: (params: any) => {
      if (!wallet.signAndSendTransactions) {
        throw new SwapKitError("wallet_near_method_not_supported");
      }
      return wallet.signAndSendTransactions(params);
    },
  } as NearSigner;
}

async function getWalletMethods() {
  const config = SKConfig.get("integrations")?.nearWalletSelector;
  const contractId = config?.contractId || "swapkit.near";

  const selector = await setupWalletSelector({
    modules: [setupMyNearWallet(), setupMeteorWallet(), setupSender(), setupHereWallet(), setupNightly()],
    network: "mainnet",
  });

  const modal = setupModal(selector, { contractId, description: "Connect your NEAR wallet to SwapKit" });

  modal.show();

  const wallet = await selector.wallet();
  const signer = createNearSigner(wallet);
  const toolbox = await getNearToolbox({ signer });
  const address = await signer.getAddress();

  const disconnect = async () => {
    try {
      await wallet.signOut();
      modal.hide();
    } catch (error) {
      throw new SwapKitError("wallet_connection_rejected_by_user", error);
    }
  };

  return { ...toolbox, address, disconnect };
}

export const walletSelector = createWallet({
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
        const { address, ...methods } = walletMethods;

        addChain({ ...methods, address, balance: [], chain: Chain.Near, walletType });

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

export const WALLET_SELECTOR_SUPPORTED_CHAINS = getWalletSupportedChains(walletSelector);
