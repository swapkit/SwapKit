import type { Wallet } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import { Chain, filterSupportedChains, WalletOption } from "@swapkit/helpers";
import { getNearToolbox } from "@swapkit/toolboxes/near";
import type { NearSigner } from "@swapkit/toolboxes/near";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

/**
 * Adapter class to make Near Wallet Selector's Wallet compatible with SwapKit's NearSigner interface
 */
class NearSignerAdapter implements NearSigner {
  private readonly wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  async getAddress(): Promise<string> {
    const accounts = await this.wallet.getAccounts();
    const accountId = accounts[0]?.accountId;
    
    if (!accountId) {
      throw new Error("No NEAR account found. Please ensure the wallet is connected and has an active account.");
    }
    
    return accountId;
  }

  // Delegate wallet methods
  getAccounts() {
    return this.wallet.getAccounts();
  }

  signAndSendTransaction(params: any) {
    if (!this.wallet.signAndSendTransaction) {
      throw new Error(`The wallet does not support signAndSendTransaction`);
    }
    return this.wallet.signAndSendTransaction(params);
  }

  signAndSendTransactions(params: any) {
    if (!this.wallet.signAndSendTransactions) {
      throw new Error(`The wallet does not support signAndSendTransactions`);
    }
    return this.wallet.signAndSendTransactions(params);
  }

  verifyOwner(params: any) {
    if (!this.wallet.verifyOwner) {
      throw new Error(`The wallet does not support verifyOwner`);
    }
    return this.wallet.verifyOwner(params);
  }

  signMessage(params: any) {
    if (!this.wallet.signMessage) {
      throw new Error(`The wallet does not support signMessage`);
    }
    return this.wallet.signMessage(params);
  }
}

const selector = await setupWalletSelector({
  modules: [
    // setupArepaWallet(),
    // setupBitgetWallet(),
    // setupBitteWallet(),
    // setupCoin98Wallet(),
    // setupEthereumWallets({ wagmiConfig, web3Modal }),
    // setupHereWallet(),
    // setupHotWallet(),
    // setupIntearWallet(),
    // setupLedger(),
    // setupMathWallet(),
    setupMeteorWallet(),
    // setupMyNearWallet(),
    // setupNarwallets(),
    // setupNearMobileWallet(),
    // setupNearSnap(),
    // setupNightly(),
    // setupOkxWallet(),
    // setupRamperWallet(),
    // setupSender(),
    // setupUnityWallet({
    //   projectId: "c4f79cc...",
    //   metadata: {
    //     name: "Your dApp name",
    //     description: "Example dApp used by NEAR Wallet Selector",
    //     url: "https://github.com/near/wallet-selector",
    //     icons: ["https://avatars.githubusercontent.com/u/37784886"],
    //   },
    // }),
    // setupWalletConnect({
    //   projectId: "c4f79cc...",
    //   metadata: {
    //     name: "NEAR Wallet Selector",
    //     description: "Example dApp used by NEAR Wallet Selector",
    //     url: "https://github.com/near/wallet-selector",
    //     icons: ["https://avatars.githubusercontent.com/u/37784886"],
    //   },
    // }),
    // setupWelldoneWallet(),
    // setupXDEFI(),
  ],
  network: "mainnet",
});

const modal = setupModal(selector, { contractId: "guest-book.testnet" });

export const exodusWallet = createWallet({
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectExodusWallet(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      const selector = await setupWalletSelector({ modules: [setupMeteorWallet()], network: "mainnet" });

      const modal = setupModal(await selector, { contractId: "test.test" });
      modal.show();

      await Promise.all(
        filteredChains.map(async (chain) => {
          try {
            const walletSelector = await selector;
            const signer = await walletSelector.wallet();

            const toolbox = await getNearToolbox({
              signer: new NearSignerAdapter(signer),
            });

            const { address, ...walletMethods } = walletData;
            const disconnect = wallet.disconnect;

            const finalDisconnect =
              disconnect ||
              (async () => {
                if (wallet.disconnect) {
                  await wallet.disconnect();
                }
              });

            addChain({
              ...walletMethods,
              address,
              chain,
              disconnect: finalDisconnect,
              walletType: WalletOption.EXOWALLET_SELECTORDUS,
            });
          } catch (error) {
            console.error(`Failed to connect ${chain} wallet:`, error);
            throw error;
          }
        }),
      );

      return true;
    },
  name: "connectExodusWallet",
  supportedChains: [Chain.Near],
  walletType: WalletOption.WALLET_SELECTOR,
});

export const EXODUS_SUPPORTED_CHAINS = getWalletSupportedChains(exodusWallet);
