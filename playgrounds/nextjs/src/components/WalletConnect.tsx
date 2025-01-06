"use client";

import { Chain, WalletOption } from "@swapkit/helpers";
import { decryptFromKeystore } from "@swapkit/wallet-keystore";
import { useCallback, useState } from "react";
import { useKeystore } from "~/components/providers/KeystoreContext";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { WalletIcon } from "~/components/ui/wallet-icon";
import { useSwapKit } from "../lib/swapKit";

interface WalletConnectProps {
  chains: Chain[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const WALLET_GROUPS = {
  "Hardware Wallets": [
    WalletOption.LEDGER,
    WalletOption.LEDGER_LIVE,
    WalletOption.TREZOR,
    WalletOption.KEEPKEY,
    WalletOption.KEEPKEY_BEX,
  ],
  "Browser Extensions": [
    WalletOption.METAMASK,
    WalletOption.PHANTOM,
    WalletOption.KEPLR,
    WalletOption.EXODUS,
    WalletOption.BRAVE,
    WalletOption.OKX,
    WalletOption.LEAP,
    WalletOption.POLKADOT_JS,
    WalletOption.TALISMAN,
    WalletOption.EIP6963,
  ],
  "Mobile Wallets": [
    WalletOption.WALLETCONNECT,
    WalletOption.COINBASE_WEB,
    WalletOption.COINBASE_MOBILE,
    WalletOption.TRUSTWALLET_WEB,
    WalletOption.OKX_MOBILE,
    WalletOption.BITGET,
  ],
  Other: [WalletOption.KEYSTORE, WalletOption.CTRL, WalletOption.RADIX_WALLET],
};

const WALLET_CHAIN_SUPPORT: Record<WalletOption, Chain[]> = {
  [WalletOption.METAMASK]: [
    Chain.Ethereum,
    Chain.BinanceSmartChain,
    Chain.Arbitrum,
    Chain.Optimism,
    Chain.Avalanche,
    Chain.Polygon,
  ],
  [WalletOption.PHANTOM]: [Chain.Solana],
  [WalletOption.KEPLR]: [Chain.Cosmos, Chain.THORChain, Chain.Maya, Chain.Kujira],
  [WalletOption.EXODUS]: [
    Chain.Ethereum,
    Chain.BinanceSmartChain,
    Chain.Solana,
    Chain.Bitcoin,
    Chain.BitcoinCash,
  ],
  [WalletOption.LEDGER]: [
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.THORChain,
    Chain.BinanceSmartChain,
    Chain.Cosmos,
    Chain.BitcoinCash,
    Chain.Litecoin,
    Chain.Dash,
    Chain.Dogecoin,
  ],
  [WalletOption.LEDGER_LIVE]: [
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.THORChain,
    Chain.BinanceSmartChain,
    Chain.Cosmos,
    Chain.BitcoinCash,
    Chain.Litecoin,
    Chain.Dash,
    Chain.Dogecoin,
  ],
  [WalletOption.TREZOR]: [
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.BinanceSmartChain,
    Chain.BitcoinCash,
    Chain.Litecoin,
    Chain.Dogecoin,
  ],
  [WalletOption.WALLETCONNECT]: [
    Chain.Ethereum,
    Chain.BinanceSmartChain,
    Chain.Arbitrum,
    Chain.Optimism,
    Chain.Avalanche,
    Chain.Polygon,
  ],
  [WalletOption.COINBASE_WEB]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.COINBASE_MOBILE]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.TRUSTWALLET_WEB]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.BITGET]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.BRAVE]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.CTRL]: [
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.THORChain,
    Chain.BinanceSmartChain,
    Chain.Cosmos,
  ],
  [WalletOption.EIP6963]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.KEEPKEY]: [Chain.Bitcoin, Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.KEEPKEY_BEX]: [Chain.Bitcoin, Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.KEYSTORE]: [
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.THORChain,
    Chain.BinanceSmartChain,
    Chain.Cosmos,
  ],
  [WalletOption.LEAP]: [Chain.Cosmos, Chain.THORChain],
  [WalletOption.OKX]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.OKX_MOBILE]: [Chain.Ethereum, Chain.BinanceSmartChain],
  [WalletOption.POLKADOT_JS]: [Chain.Polkadot],
  [WalletOption.RADIX_WALLET]: [Chain.Radix],
  [WalletOption.TALISMAN]: [Chain.Polkadot],
};

export const WalletConnect = ({ chains, onSuccess, onError }: WalletConnectProps) => {
  const { swapKit, connectWallet } = useSwapKit();
  const { keystoreFile, setIsDecrypting, setIsOpen, setKeystoreFile, setOnSubmit, setOnCancel } =
    useKeystore();
  const [loadingWallet, setLoadingWallet] = useState<WalletOption | null>(null);

  const handleKeystoreSubmit = useCallback(
    async (password: string) => {
      if (!swapKit || !keystoreFile) return;

      try {
        setIsDecrypting(true);
        const phrase = await decryptFromKeystore(keystoreFile.keystore, password);
        if (!phrase) throw new Error("Failed to decrypt keystore");
        await swapKit.connectKeystore(chains, phrase);
        onSuccess?.();
        debugger;
        setIsOpen(false);
        setKeystoreFile(null);
      } catch (e) {
        if (e instanceof Error) {
          onError?.(new Error(`Failed to decrypt keystore: ${e.message}`));
        } else {
          onError?.(new Error("Invalid password or corrupted keystore file"));
        }
      } finally {
        setIsDecrypting(false);
      }
    },
    [
      swapKit,
      chains,
      keystoreFile,
      onSuccess,
      onError,
      setIsDecrypting,
      setIsOpen,
      setKeystoreFile,
    ],
  );

  const handleKeystoreFile = useCallback(
    async (file: File) => {
      try {
        const keystoreFile = await file.text();
        const parsed = JSON.parse(keystoreFile);

        if (!parsed.crypto?.kdfparams?.salt || !parsed.crypto?.ciphertext) {
          throw new Error("Invalid keystore format");
        }

        setKeystoreFile({ keystore: parsed, file });
        setOnSubmit(() => handleKeystoreSubmit);
        setIsOpen(true);
      } catch (error) {
        if (error instanceof Error) {
          onError?.(error);
        } else {
          onError?.(new Error("Invalid keystore file"));
        }
      }
    },
    [handleKeystoreSubmit, onError, setKeystoreFile, setOnSubmit, setOnCancel, setIsOpen],
  );

  const handleConnect = useCallback(
    async (option: WalletOption) => {
      if (!swapKit) {
        onError?.(new Error("SwapKit not initialized"));
        return;
      }

      setLoadingWallet(option);

      try {
        if (option === WalletOption.KEYSTORE) {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".txt,.json";
          input.style.display = "none";
          document.body.appendChild(input);

          const cleanup = () => {
            document.body.removeChild(input);
          };

          await new Promise<void>((resolve) => {
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) {
                onError?.(new Error("No file selected"));
                cleanup();
                resolve();
                return;
              }
              try {
                await handleKeystoreFile(file);
              } catch (error) {
                onError?.(
                  error instanceof Error ? error : new Error("Failed to read keystore file"),
                );
              } finally {
                cleanup();
                resolve();
              }
            };

            input.click();
          });
          return;
        }

        await connectWallet(option, chains);
        onSuccess?.();
      } catch (error) {
        if (error instanceof Error) {
          onError?.(error);
        } else {
          onError?.(new Error(`Failed to connect ${option}`));
        }
      } finally {
        setLoadingWallet(null);
      }
    },
    [chains, swapKit, connectWallet, handleKeystoreFile, onSuccess, onError],
  );

  if (chains.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Select chains to see compatible wallets
      </div>
    );
  }

  const supportedWallets = Object.entries(WALLET_GROUPS)
    .map(([groupName, wallets]) => {
      const groupWallets = wallets.filter((wallet) => {
        const supportedChains = WALLET_CHAIN_SUPPORT[wallet];
        return chains.every((chain) => supportedChains?.includes(chain));
      });

      if (groupWallets.length === 0) return null;

      return (
        <div key={groupName}>
          <DropdownMenuLabel className="font-bold">{groupName}</DropdownMenuLabel>
          {groupWallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet}
              onClick={() => handleConnect(wallet)}
              disabled={loadingWallet !== null}
              className="cursor-pointer pl-4"
            >
              <WalletIcon wallet={wallet} className="mr-2" />
              <span className="flex-1">{wallet}</span>
              {loadingWallet === wallet && (
                <span className="text-xs text-muted-foreground">Connecting...</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </div>
      );
    })
    .filter(Boolean);

  if (supportedWallets.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No wallets support this combination of chains. Please select different chains.
      </div>
    );
  }

  return <div className="max-h-[400px] overflow-y-auto">{supportedWallets}</div>;
};
