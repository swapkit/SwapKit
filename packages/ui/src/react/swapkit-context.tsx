"use client";

import type { Chain, ChainWallet, EVMChain, SKConfigState } from "@swapkit/sdk";
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
    walletType,
    isWalletConnected,
    keystoreFile,
    isKeystoreOpen,
    isKeystoreDecrypting,
    isConnectingWallet,
    setSwapKit,
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

  const loadSwapKit = useCallback(
    async (params?: { config: SKConfigState | undefined }) => {
      const { createSwapKit } = await import("@swapkit/sdk");

      const swapKitClient = createSwapKit({ config: params?.config });

      setSwapKit(swapKitClient);
    },
    [setSwapKit],
  );

  const connectWallet = useCallback(
    async (option: WalletOption, chains: Chain[]) => {
      setIsConnectingWallet(true);
      setWalletState({ connected: false, type: option });

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

          default:
            throw new Error(`Unsupported wallet option: ${option}`);
        }

        const isConnected = chains.some((chain) => !!swapKit?.getAddress(chain));

        if (!isConnected) throw new Error("Failed to connect wallet");

        setWalletState({ connected: isConnected, type: option });

        await Promise.all(chains.map((chain) => swapKit?.getWalletWithBalance(chain)));

        setSwapKit(swapKit);
      } catch (error) {
        console.error(`Failed to connect ${option}:`, error);

        setWalletState({ connected: false, type: null });

        throw new Error(`Failed to connect ${option}: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsConnectingWallet(false);
      }
    },
    [setWalletState, swapKit, setIsConnectingWallet, setSwapKit],
  );

  const disconnectWallet = useCallback(() => {
    swapKit?.disconnectAll();
    setWalletState({ connected: false, type: null });
  }, [swapKit?.disconnectAll, setWalletState]);

  const checkIfChainConnected = useCallback((chain: Chain) => !!swapKit?.getAddress(chain), [swapKit?.getAddress]);

  const connectKeystore = useCallback(
    async (password: string) => {
      if (!keystoreFile?.keystore || !swapKit) return;

      try {
        setIsKeystoreDecrypting(true);

        const { decryptFromKeystore } = await import("@swapkit/wallets/keystore");
        const phrase = await decryptFromKeystore(keystoreFile.keystore, password);

        if (!phrase) throw new Error("Failed to decrypt keystore");

        await swapKit.connectKeystore(keystoreFile.chains, phrase);

        setWalletState({ connected: true, type: WalletOption.KEYSTORE });

        await Promise.all(keystoreFile.chains.map((balance) => swapKit?.getWalletWithBalance(balance)));

        setIsKeystoreOpen(false);
        setKeystoreFile(null);
      } catch (error) {
        console.error("Failed to decrypt keystore:", error);
        setWalletState({ connected: false, type: null });
      } finally {
        setIsKeystoreDecrypting(false);
      }
    },
    [keystoreFile, swapKit, setWalletState, setIsKeystoreOpen, setKeystoreFile, setIsKeystoreDecrypting],
  );

  const balances =
    (Object.entries(swapKit?.getAllWallets() || {})?.flatMap(([chain, wallet]) =>
      wallet?.balance?.flatMap((balance) => ({ balance, chain, identifier: `${chain}.${balance.symbol}`, wallet })),
    ) as { balance: AssetValue; chain: Chain; identifier: string; wallet: ChainWallet<Chain> }[]) || [];

  return useMemo(
    // biome-ignore assist/source/useSortedKeys: sort by variable type/use case, not alphabetically
    () => ({
      swapKit,
      loadSwapKit,

      balances,

      walletType,
      isConnectingWallet,
      isWalletConnected,

      checkIfChainConnected,
      connectKeystore,
      connectWallet,
      disconnectWallet,

      // Keystore related
      keystoreFile,

      isKeystoreDecrypting,
      isKeystoreOpen,

      setIsKeystoreDecrypting,
      setIsKeystoreOpen,
      setKeystoreFile,
    }),
    [
      swapKit,
      loadSwapKit,
      balances,
      walletType,
      isConnectingWallet,
      isWalletConnected,
      checkIfChainConnected,
      connectKeystore,
      connectWallet,
      disconnectWallet,
      keystoreFile,
      isKeystoreDecrypting,
      isKeystoreOpen,
      setIsKeystoreDecrypting,
      setIsKeystoreOpen,
      setKeystoreFile,
    ],
  );
};
