"use client";

import type { Chain, EVMChain, SKConfigState, TokenNames } from "@swapkit/sdk";
import { AssetValue, NetworkDerivationPath, WalletOption } from "@swapkit/sdk";
import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import type { BalanceDetails, KeystoreFile, SwapKitState } from "./types";

const useSwapKitStore = create<SwapKitState>((set) => {
  // biome-ignore assist/source/useSortedKeys: sort by variable type/use case, not alphabetically
  return {
    swapKit: null,

    balances: [],
    walletType: null,
    isConnectingWallet: false,
    isWalletConnected: false,

    setSwapKit: (swapKit) => set({ swapKit }),
    setWalletState: ({ connected, type }) => set({ isWalletConnected: connected, walletType: type }),
    setIsConnectingWallet: (isConnectingWallet) => set({ isConnectingWallet }),
  };
});

await AssetValue.loadStaticAssets();

export const assetsMap = new Map<TokenNames | (string & {}), AssetValue>(
  Array.from(AssetValue.staticAssets.keys()).map((identifier) => [
    identifier,
    AssetValue.from({ asset: identifier as TokenNames }),
  ]),
);

export const useSwapKit = () => {
  const {
    swapKit,
    walletType,
    isWalletConnected,
    isConnectingWallet,
    setSwapKit,
    setWalletState,
    setIsConnectingWallet,
  } = useSwapKitStore((state) => state);

  // biome-ignore lint/correctness/useExhaustiveDependencies: biome is bugging out
  useEffect(() => {
    if (swapKit) return;

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
            await swapKit?.connectEVMWallet?.(chains as EVMChain[]);
            break;

          case WalletOption.PHANTOM:
            await swapKit?.connectPhantom?.(chains);
            break;

          case WalletOption.KEPLR:
            await swapKit?.connectKeplr?.(chains);
            break;

          case WalletOption.LEDGER:
            await swapKit?.connectLedger?.(chains);
            break;

          case WalletOption.TREZOR: {
            const [chain] = chains;
            if (!chain) throw new Error("Chain is required for Trezor");
            await swapKit?.connectTrezor?.(chains, NetworkDerivationPath[chain]);
            break;
          }

          case WalletOption.WALLETCONNECT:
            await swapKit?.connectWalletconnect?.(chains);
            break;

          case WalletOption.COINBASE_MOBILE:
            await swapKit?.connectCoinbaseWallet?.(chains);
            break;

          case WalletOption.BITGET:
            await swapKit?.connectBitget?.(chains);
            break;

          case WalletOption.CTRL:
            await swapKit?.connectCtrl?.(chains);
            break;

          case WalletOption.KEEPKEY:
            await swapKit?.connectKeepkey?.(chains);
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
            await swapKit?.connectOkx?.(chains);
            break;

          case WalletOption.POLKADOT_JS:
            await swapKit?.connectPolkadotJs?.(chains);
            break;

          case WalletOption.RADIX_WALLET:
            await swapKit?.connectRadixWallet?.(chains);
            break;

          case WalletOption.TALISMAN:
            await swapKit?.connectTalisman?.(chains);
            break;

          default:
            throw new Error(`Unsupported wallet option: ${option}`);
        }

        const isConnected = chains.some((chain) => !!swapKit?.getAddress(chain));

        if (!isConnected) throw new Error("Failed to connect wallet");

        setWalletState({ connected: isConnected, type: option });

        await Promise.allSettled(chains.map((chain) => swapKit?.getWalletWithBalance(chain)));

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
  }, [swapKit, setWalletState]);

  const checkIfChainConnected = useCallback((chain: Chain) => !!swapKit?.getAddress(chain), [swapKit]);

  const connectKeystore = useCallback(
    async (keystoreFile: KeystoreFile, password: string) => {
      if (!keystoreFile?.keystore || !swapKit) return;

      try {
        setIsConnectingWallet(true);

        const { decryptFromKeystore } = await import("@swapkit/wallet-keystore");
        const phrase = await decryptFromKeystore(keystoreFile.keystore, password);

        if (!phrase) throw new Error("Failed to decrypt keystore");

        await swapKit?.connectKeystore?.(keystoreFile.chains, phrase);

        setWalletState({ connected: true, type: WalletOption.KEYSTORE });

        await Promise.allSettled(keystoreFile.chains.map((balance) => swapKit?.getWalletWithBalance(balance)));
      } catch (error) {
        console.error("Failed to decrypt keystore:", error);
        throw new Error("Failed to decrypt keystore");
      } finally {
        setIsConnectingWallet(false);
      }
    },
    [swapKit, setWalletState, setIsConnectingWallet],
  );

  const stableWalletsMemoKey = Object.entries(swapKit?.getAllWallets?.() || {})
    .map(([chain, wallet]) => `${chain}:${wallet?.balance?.map((bal) => bal.toString()).join("_")}`)
    .join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: uses stable memo key for performance reasons
  const balancesByChain = useMemo(() => {
    const balancesByChain = new Map<Chain, BalanceDetails[]>();

    Object.values(swapKit?.getAllWallets?.() || {})?.forEach((wallet) => {
      wallet?.balance?.forEach((balance) => {
        const balances = balancesByChain.get(wallet.chain) || [];

        balances.push({ balance, chain: wallet.chain, identifier: balance.toString(), wallet });

        balancesByChain.set(wallet.chain, balances);
      });
    });

    return balancesByChain;
  }, [stableWalletsMemoKey]);

  return useMemo(
    // biome-ignore assist/source/useSortedKeys: sort by variable type/use case, not alphabetically
    () => ({
      swapKit,
      loadSwapKit,

      balancesByChain,
      isWalletConnected,
      isConnectingWallet,
      walletType,

      checkIfChainConnected,
      connectKeystore,
      connectWallet,
      disconnectWallet,
    }),
    [
      swapKit,
      balancesByChain,
      isWalletConnected,
      isConnectingWallet,
      walletType,
      checkIfChainConnected,
      connectKeystore,
      connectWallet,
      disconnectWallet,
      loadSwapKit,
    ],
  );
};
