"use client";

import type { AssetValue, Chain, EVMChain } from "@swapkit/helpers";
import { NetworkDerivationPath, WalletOption } from "@swapkit/helpers";
import type { createSwapKit } from "@swapkit/sdk";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect } from "react";

type KeystoreFile = {
  keystore: import("@swapkit/wallets/keystore").Keystore;
  file: File;
  chains: Chain[];
} | null;

const swapKitAtom = atom<ReturnType<typeof createSwapKit> | null>(null);
const balanceAtom = atom<AssetValue[]>([]);
const walletState = atom<{ connected: boolean; type: WalletOption | null }>({
  connected: false,
  type: null,
});
const keystoreFileAtom = atom<KeystoreFile>(null);
const isKeystoreOpenAtom = atom<boolean>(false);
const isKeystoreDecryptingAtom = atom<boolean>(false);

export const useSwapKit = () => {
  const [swapKit, setSwapKit] = useAtom(swapKitAtom);
  const [balances, setBalances] = useAtom(balanceAtom);
  const [{ type: walletType, connected: isWalletConnected }, setWalletState] = useAtom(walletState);

  useEffect(() => {
    const loadSwapKit = async () => {
      const { createSwapKit } = await import("@swapkit/sdk");

      const swapKitClient = createSwapKit({
        config: {
          apiKeys: {
            swapKit: process.env.NEXT_PUBLIC_TEST_API_KEY || "",
            walletConnectProjectId: "",
            keepKey: localStorage.getItem("keepkeyApiKey") || "",
          },
          integrations: {
            keepKey: {
              name: "THORSwap",
              imageUrl: "https://www.thorswap.finance/logo.png",
              basePath: "swap",
              url: "https://app.thorswap.finance",
            },
          },
        },
      });

      setSwapKit(swapKitClient);
    };

    loadSwapKit();
  }, [setSwapKit]);

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
      }
    },
    [setWalletState, setBalances, swapKit],
  );

  const disconnectWallet = useCallback(() => {
    swapKit?.disconnectAll();
    setWalletState({ connected: false, type: null });
  }, [setWalletState, swapKit]);

  const checkIfChainConnected = useCallback(
    (chain: Chain) => !!swapKit?.getAddress(chain),
    [swapKit?.getAddress],
  );

  const [keystoreFile, setKeystoreFile] = useAtom(keystoreFileAtom);
  const [isKeystoreOpen, setIsKeystoreOpen] = useAtom(isKeystoreOpenAtom);
  const [isKeystoreDecrypting, setIsKeystoreDecrypting] = useAtom(isKeystoreDecryptingAtom);

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
    [
      keystoreFile,
      swapKit,
      setWalletState,
      setBalances,
      setIsKeystoreOpen,
      setKeystoreFile,
      setIsKeystoreDecrypting,
    ],
  );

  return {
    balances,
    checkIfChainConnected,
    connectWallet,
    disconnectWallet,
    getBalances,
    isWalletConnected,
    swapKit,
    walletType,
    // Keystore related
    keystoreFile,
    setKeystoreFile,
    isKeystoreOpen,
    setIsKeystoreOpen,
    isKeystoreDecrypting,
    setIsKeystoreDecrypting,
    connectKeystore,
  };
};
