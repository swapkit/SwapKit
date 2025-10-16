"use client";

import type { Chain, EVMChain, SKConfigState } from "@swapkit/sdk";
import { AssetValue, NetworkDerivationPath, WalletOption } from "@swapkit/sdk";
import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import type { SwapKitState } from "./types";

const useSwapKitStore = create<SwapKitState>((set) => {
  // biome-ignore assist/source/useSortedKeys: sort by variable type/use case, not alphabetically
  return {
    swapKit: null,

    balances: [],
    walletType: null,
    isConnectingWallet: false,
    isWalletConnected: false,

    keystoreFile: null,
    isKeystoreOpen: false,
    isKeystoreDecrypting: false,

    setSwapKit: (swapKit) => set({ swapKit }),
    setBalances: (balances) => set({ balances }),
    setWalletState: ({ connected, type }) => set({ isWalletConnected: connected, walletType: type }),
    setKeystoreFile: (keystoreFile) => set({ keystoreFile }),
    setIsKeystoreOpen: (isKeystoreOpen) => set({ isKeystoreOpen }),
    setIsKeystoreDecrypting: (isKeystoreDecrypting) => set({ isKeystoreDecrypting }),
    setIsConnectingWallet: (isConnectingWallet) => set({ isConnectingWallet }),
  };
});

export const useSwapKit = () => {
  const {
    swapKit,
    balances,
    walletType,
    isWalletConnected,
    keystoreFile,
    isKeystoreOpen,
    isKeystoreDecrypting,
    isConnectingWallet,
    setSwapKit,
    setBalances,
    setWalletState,
    setKeystoreFile,
    setIsKeystoreOpen,
    setIsKeystoreDecrypting,
    setIsConnectingWallet,
  } = useSwapKitStore((state) => state);

  // biome-ignore lint/correctness/useExhaustiveDependencies: biome is bugging out
  useEffect(() => {
    if (swapKit) return;

    void AssetValue.loadStaticAssets();
    void loadSwapKit();
  }, []);

  async function loadSwapKit(params?: { config: SKConfigState | undefined }) {
    const { createSwapKit } = await import("@swapkit/sdk");

    const swapKitClient = createSwapKit({ config: params?.config });

    setSwapKit(swapKitClient);
  }

  const getBalances = useCallback(
    async (refresh?: boolean) => {
      if ((!refresh && balances.length) || !swapKit) return;

      const connectedWallets = swapKit.getAllWallets();
      let nextBalances: AssetValue[] = [];

      for (const chain of Object.keys(connectedWallets)) {
        const balance = await swapKit?.getBalance(chain as Chain);
        nextBalances = nextBalances.concat(balance);
      }

      setBalances(nextBalances.sort((a, b) => a.getValue("number") - b.getValue("number")));
    },
    [swapKit, setBalances, balances],
  );

  const connectWallet = useCallback(
    async (option: WalletOption, chains: Chain[]) => {
      setIsConnectingWallet(true);
      try {
        switch (option) {
          case WalletOption.METAMASK:
          case WalletOption.COINBASE_WEB:
          case WalletOption.TRUSTWALLET_WEB:
            await swapKit?.connectEVMWallet(chains as EVMChain[]);
            break;

          case WalletOption.PHANTOM:
            await swapKit?.connectPhantom(chains);
            break;

          case WalletOption.KEPLR:
            await swapKit?.connectKeplr(chains);
            break;

          case WalletOption.LEDGER:
            await swapKit?.connectLedger(chains);
            break;

          case WalletOption.TREZOR: {
            const [chain] = chains;
            if (!chain) throw new Error("Chain is required for Trezor");
            await swapKit?.connectTrezor(chains, NetworkDerivationPath[chain]);
            break;
          }

          case WalletOption.WALLETCONNECT:
            await swapKit?.connectWalletconnect(chains);
            break;

          case WalletOption.COINBASE_MOBILE:
            await swapKit?.connectCoinbaseWallet(chains);
            break;

          case WalletOption.BITGET:
            await swapKit?.connectBitget(chains);
            break;

          case WalletOption.CTRL:
            await swapKit?.connectCtrl(chains);
            break;

          case WalletOption.KEEPKEY:
            await swapKit?.connectKeepkey(chains);
            break;

          case WalletOption.KEEPKEY_BEX:
            await swapKit?.connectKeepkeyBex?.(chains);
            break;

          case WalletOption.ONEKEY:
            await swapKit?.connectOnekeyWallet?.(chains);
            break;

          case WalletOption.KEYSTORE:
            // Keystore handling is moved to the KeystoreHandler component
            break;

          case WalletOption.OKX:
          case WalletOption.OKX_MOBILE:
            await swapKit?.connectOkx(chains);
            break;

          case WalletOption.POLKADOT_JS:
            await swapKit?.connectPolkadotJs(chains);
            break;

          case WalletOption.RADIX_WALLET:
            await swapKit?.connectRadixWallet(chains);
            break;

          case WalletOption.TALISMAN:
            await swapKit?.connectTalisman(chains);
            break;

          default: {
            console.warn(`Unsupported wallet option: ${option}`);
            return;
          }
        }

        const isConnected = chains.some((chain) => !!swapKit?.getAddress(chain));
        setWalletState({ connected: isConnected, type: option });

        if (isConnected) {
          const balancePromises = chains.map(async (chain) => {
            const wallet = await swapKit?.getWalletWithBalance(chain);
            if (!(wallet && "balance" in wallet)) return [];
            return wallet.balance as AssetValue[];
          });
          const chainBalances = await Promise.all(balancePromises);
          const allBalances = chainBalances.flat();
          setBalances(allBalances.sort((a, b) => a.getValue("number") - b.getValue("number")));
        }
      } catch (error) {
        console.error(`Failed to connect ${option}:`, error);
        setWalletState({ connected: false, type: null });
      } finally {
        setIsConnectingWallet(false);
      }
    },
    [setWalletState, setBalances, swapKit, setIsConnectingWallet],
  );

  const disconnectWallet = useCallback(() => {
    swapKit?.disconnectAll();
    setWalletState({ connected: false, type: null });
  }, [swapKit?.disconnectAll, setWalletState]);

  const checkIfChainConnected = useCallback((chain: Chain) => !!swapKit?.getAddress(chain), [swapKit?.getAddress]);

  const connectKeystore = useCallback(
    async (password: string) => {
      if (!(keystoreFile && swapKit)) return;

      try {
        setIsKeystoreDecrypting(true);
        const { decryptFromKeystore } = await import("@swapkit/wallets/keystore");
        const phrase = await decryptFromKeystore(keystoreFile.keystore, password);
        if (!phrase) throw new Error("Failed to decrypt keystore");

        await swapKit.connectKeystore(keystoreFile.chains, phrase);
        setWalletState({ connected: true, type: WalletOption.KEYSTORE });
        setIsKeystoreOpen(false);
        setKeystoreFile(null);

        const balancePromises = keystoreFile.chains.map(async (chain) => {
          const wallet = await swapKit?.getWalletWithBalance(chain);
          if (!(wallet && "balance" in wallet)) return [];
          return wallet.balance as AssetValue[];
        });
        const chainBalances = await Promise.all(balancePromises);
        const allBalances = chainBalances.flat();
        setBalances(allBalances.sort((a, b) => a.getValue("number") - b.getValue("number")));
      } catch (error) {
        console.error("Failed to decrypt keystore:", error);
        setWalletState({ connected: false, type: null });
      } finally {
        setIsKeystoreDecrypting(false);
      }
    },
    [keystoreFile, swapKit, setWalletState, setBalances, setIsKeystoreOpen, setKeystoreFile, setIsKeystoreDecrypting],
  );

  const { chains, balanceGroupedByChain } = useMemo(() => {
    const balanceGroupedByChain = (Array.isArray(balances) ? balances : []).reduce(
      (acc: Record<Chain, AssetValue[]>, assetValue: AssetValue) => {
        if (!acc[assetValue.chain]) {
          acc[assetValue.chain] = [];
        }

        if (assetValue.isGasAsset || assetValue.getValue("number") > 0) {
          acc[assetValue.chain].push(assetValue);
        }

        return acc;
      },
      {} as Record<Chain, AssetValue[]>,
    );

    const chains = Object.keys(balanceGroupedByChain) as Chain[];

    return { balanceGroupedByChain, chains };
  }, [balances]);

  // biome-ignore assist/source/useSortedKeys: sort by variable type/use case, not alphabetically
  return {
    swapKit,
    loadSwapKit,

    walletType,
    balanceGroupedByChain,
    balances,
    chains,
    isConnectingWallet,
    isWalletConnected,

    checkIfChainConnected,
    connectKeystore,
    connectWallet,
    disconnectWallet,
    getBalances,

    // Keystore related
    keystoreFile,

    isKeystoreDecrypting,
    isKeystoreOpen,

    setIsKeystoreDecrypting,
    setIsKeystoreOpen,
    setKeystoreFile,
  };
};
