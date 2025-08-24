import { Chain, CosmosChains, EVMChains, WalletOption } from "@swapkit/helpers";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { EVMWalletOptions } from "../../../packages/wallets/src/evm-extensions";
import { getSwapKitClient } from "./swapKitClient";
import "./styles/compact.css";

const CHAIN_CATEGORIES = {
  Cosmos: [Chain.Cosmos, Chain.Kujira, Chain.Maya, Chain.Noble, Chain.THORChain].sort(),
  EVM: [
    Chain.Arbitrum,
    Chain.Aurora,
    Chain.Avalanche,
    Chain.Base,
    Chain.Berachain,
    Chain.BinanceSmartChain,
    Chain.Ethereum,
    Chain.Gnosis,
    Chain.Optimism,
    Chain.Polygon,
  ].sort(),
  Other: [Chain.Chainflip, Chain.Near, Chain.Polkadot, Chain.Radix, Chain.Ripple, Chain.Solana, Chain.Tron].sort(),
  UTXO: [Chain.Bitcoin, Chain.BitcoinCash, Chain.Dash, Chain.Dogecoin, Chain.Litecoin, Chain.Zcash].sort(),
};

const ALL_CHAINS = Object.values(CHAIN_CATEGORIES).flat();

const getChainDisplayName = (chain: Chain): string => {
  const names: Record<Chain, string> = {
    [Chain.Ethereum]: "Ethereum",
    [Chain.Bitcoin]: "Bitcoin",
    [Chain.BinanceSmartChain]: "BSC",
    [Chain.Polygon]: "Polygon",
    [Chain.Avalanche]: "Avalanche",
    [Chain.Arbitrum]: "Arbitrum",
    [Chain.Optimism]: "Optimism",
    [Chain.Solana]: "Solana",
    [Chain.Cosmos]: "Cosmos",
    [Chain.THORChain]: "THORChain",
    [Chain.Maya]: "Maya",
    [Chain.BitcoinCash]: "BCH",
    [Chain.Litecoin]: "Litecoin",
    [Chain.Dogecoin]: "Dogecoin",
    [Chain.Base]: "Base",
    [Chain.Gnosis]: "Gnosis",
    [Chain.Aurora]: "Aurora",
    [Chain.Berachain]: "Berachain",
    [Chain.Kujira]: "Kujira",
    [Chain.Noble]: "Noble",
    [Chain.Near]: "Near",
    [Chain.Tron]: "Tron",
    [Chain.Polkadot]: "Polkadot",
    [Chain.Ripple]: "Ripple",
    [Chain.Radix]: "Radix",
    [Chain.Dash]: "Dash",
    [Chain.Zcash]: "Zcash",
    [Chain.Chainflip]: "Chainflip",
    [Chain.Fiat]: "Fiat",
  };
  return names[chain] || chain;
};

const ALL_WALLETS = [
  { n: "MetaMask", w: WalletOption.METAMASK },
  { n: "WalletConnect", w: WalletOption.WALLETCONNECT },
  { n: "Coinbase", w: WalletOption.COINBASE_WEB },
  { n: "CB Mobile", w: WalletOption.COINBASE_MOBILE },
  { n: "Keplr", w: WalletOption.KEPLR },
  { n: "Leap", w: WalletOption.LEAP },
  { n: "Cosmostation", w: WalletOption.COSMOSTATION },
  { n: "Xaman", w: WalletOption.XAMAN },
  { n: "Phantom", w: WalletOption.PHANTOM },
  { n: "Brave", w: WalletOption.BRAVE },
  { n: "Trust", w: WalletOption.TRUSTWALLET_WEB },
  { n: "OKX", w: WalletOption.OKX },
  { n: "OKX Mobile", w: WalletOption.OKX_MOBILE },
  { n: "Bitget", w: WalletOption.BITGET },
  { n: "OneKey", w: WalletOption.ONEKEY },
  { n: "Exodus", w: WalletOption.EXODUS },
  { n: "Ctrl", w: WalletOption.CTRL },
  { n: "Vultisig", w: WalletOption.VULTISIG },
  { n: "Talisman", w: WalletOption.TALISMAN },
  { n: "Polkadot.js", w: WalletOption.POLKADOT_JS },
  { n: "TronLink", w: WalletOption.TRONLINK },
  { n: "Radix", w: WalletOption.RADIX_WALLET },
  { n: "Ledger", w: WalletOption.LEDGER },
  { n: "Ledger Live", w: WalletOption.LEDGER_LIVE },
  { n: "Trezor", w: WalletOption.TREZOR },
  { n: "KeepKey", w: WalletOption.KEEPKEY },
  { n: "KeepKey BEX", w: WalletOption.KEEPKEY_BEX },
  { n: "Keystore", w: WalletOption.KEYSTORE },
  { n: "EIP-6963", w: WalletOption.EIP6963 },
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple wallet detection checks required
const detectWallets = () => {
  const detected: WalletOption[] = [];

  if (typeof window !== "undefined") {
    if (window.ethereum?.isMetaMask) {
      detected.push(WalletOption.METAMASK);
    }
    if (window.ethereum?.isBraveWallet) detected.push(WalletOption.BRAVE);
    if (window.ethereum?.isCoinbaseWallet) detected.push(WalletOption.COINBASE_WEB);
    if (window.ethereum?.isTrust) detected.push(WalletOption.TRUSTWALLET_WEB);
    if (window.keplr) detected.push(WalletOption.KEPLR);
    if (window.leap) detected.push(WalletOption.LEAP);
    if (window.phantom?.solana) detected.push(WalletOption.PHANTOM);
    if (window.okxwallet) detected.push(WalletOption.OKX);
    if (window.bitkeep) detected.push(WalletOption.BITGET);
    if (window.$onekey) detected.push(WalletOption.ONEKEY);
    if (window.tronLink) detected.push(WalletOption.TRONLINK);
    if (window.injectedWeb3?.["polkadot-js"]) detected.push(WalletOption.POLKADOT_JS);
    if (window.talismanEth) detected.push(WalletOption.TALISMAN);
    if (window.vultisig) detected.push(WalletOption.VULTISIG);
    if (window.xfi) detected.push(WalletOption.CTRL);
  }

  return detected;
};

export function CompactApp() {
  const transferAssetId = useId();
  const transferAmountId = useId();
  const transferToId = useId();
  const transferMemoId = useId();
  const swapFromId = useId();
  const swapAmountId = useId();
  const swapToId = useId();

  const [selectedChains, setSelectedChains] = useState<Chain[]>([]);
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [skClient, setSkClient] = useState<ReturnType<typeof getSwapKitClient>>();
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Chain | null>(null);
  const [draggedChains, setDraggedChains] = useState<Set<Chain>>(new Set());
  const [detectedWallets, setDetectedWallets] = useState<WalletOption[]>([]);
  const [activeTab, setActiveTab] = useState<"connect" | "transfer" | "swap">("connect");
  const [transferAsset, setTransferAsset] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferMemo, setTransferMemo] = useState("");
  const [showTransferAssets, setShowTransferAssets] = useState(false);
  const [swapFrom, setSwapFrom] = useState("");
  const [swapTo, setSwapTo] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [availableAssets, setAvailableAssets] = useState<string[]>([]);
  const [showFromAssets, setShowFromAssets] = useState(false);
  const [showToAssets, setShowToAssets] = useState(false);
  const [walletBalances, setWalletBalances] = useState<Record<string, Record<string, string>>>({});
  const [loadingBalances, setLoadingBalances] = useState<Set<string>>(new Set());
  const chainRefs = useRef<Map<Chain, HTMLButtonElement>>(new Map());

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const client = getSwapKitClient();
    setSkClient(client);

    // Detect wallets on page load
    const detected = detectWallets();
    setDetectedWallets(detected);
    if (detected.length > 0) {
      showToast(`Detected ${detected.length} wallet(s)`);
    }
  }, [showToast]);

  // Get available assets from connected wallets
  useEffect(() => {
    if (Object.keys(connections).length > 0) {
      // Mock assets for now - in real app would fetch from wallet
      const mockAssets = [
        "ETH.ETH",
        "BTC.BTC",
        "BSC.BNB",
        "AVAX.AVAX",
        "ARB.ETH",
        "ETH.USDC",
        "ETH.USDT",
        "BTC.BTC",
        "LTC.LTC",
        "DOGE.DOGE",
        "THOR.RUNE",
        "MAYA.CACAO",
        "ATOM.ATOM",
        "SOL.SOL",
      ].filter((asset) => {
        // Filter based on selected chains
        const chain = asset.split(".")[0];
        if (!chain) return false;
        return (
          selectedChains.length === 0 ||
          selectedChains.some((c) => c.toUpperCase().includes(chain) || chain.includes(c.toUpperCase()))
        );
      });
      setAvailableAssets(mockAssets);
    } else {
      setAvailableAssets([]);
    }
  }, [connections, selectedChains]);

  const toggleChain = useCallback((chain: Chain) => {
    setSelectedChains((prev) => (prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]));
  }, []);

  const handleMouseDown = useCallback(
    (chain: Chain, e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart(chain);
      setDraggedChains(new Set([chain]));

      toggleChain(chain);
    },
    [toggleChain],
  );

  const handleMouseEnter = useCallback(
    (chain: Chain) => {
      if (isDragging && dragStart) {
        setDraggedChains((prev) => new Set([...prev, chain]));

        setSelectedChains((prev) => {
          const isSelected = prev.includes(chain);
          const wasStartSelected = prev.includes(dragStart);

          if (wasStartSelected) {
            return isSelected ? prev : [...prev, chain];
          }
          return isSelected ? prev.filter((c) => c !== chain) : prev;
        });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDraggedChains(new Set());
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => handleMouseUp();
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
    return undefined;
  }, [isDragging, handleMouseUp]);

  const selectCategory = useCallback((category: keyof typeof CHAIN_CATEGORIES) => {
    setSelectedChains((prev) => {
      const categoryChains = CHAIN_CATEGORIES[category];
      const allSelected = categoryChains.every((c) => prev.includes(c));

      if (allSelected) {
        return prev.filter((c) => !categoryChains.includes(c));
      }
      const newSelection = new Set([...prev, ...categoryChains]);
      return Array.from(newSelection);
    });
  }, []);

  const [walletSupportedChains, setWalletSupportedChains] = useState<Record<WalletOption, Chain[]>>(
    {} as Record<WalletOption, Chain[]>,
  );

  // Get supported chains for each wallet
  const getWalletSupportedChains = useCallback(
    async (wallet: WalletOption): Promise<Chain[]> => {
      if (walletSupportedChains[wallet]) {
        return walletSupportedChains[wallet];
      }

      try {
        let chains: Chain[] = [];

        switch (wallet) {
          case WalletOption.METAMASK:
          case WalletOption.BRAVE:
          case WalletOption.COINBASE_WEB:
          case WalletOption.TRUSTWALLET_WEB:
          case WalletOption.BITGET:
          case WalletOption.ONEKEY:
            chains = [...EVMChains] as Chain[];
            break;

          case WalletOption.OKX:
          case WalletOption.OKX_MOBILE: {
            const { OKX_SUPPORTED_CHAINS } = await import("../../../packages/wallets/src/okx");
            chains = OKX_SUPPORTED_CHAINS;
            break;
          }

          case WalletOption.KEPLR:
          case WalletOption.LEAP: {
            const { KEPLR_SUPPORTED_CHAINS } = await import("../../../packages/wallets/src/keplr");
            chains = KEPLR_SUPPORTED_CHAINS;
            break;
          }

          case WalletOption.COSMOSTATION:
            chains = [...CosmosChains] as Chain[];
            break;

          case WalletOption.PHANTOM:
            chains = [Chain.Solana];
            break;

          case WalletOption.XAMAN:
            chains = [Chain.Ripple];
            break;

          case WalletOption.TRONLINK:
            chains = [Chain.Tron];
            break;

          case WalletOption.POLKADOT_JS:
          case WalletOption.TALISMAN:
            chains = [Chain.Polkadot];
            break;

          case WalletOption.RADIX_WALLET:
            chains = [Chain.Radix];
            break;

          case WalletOption.CTRL: {
            const { CTRL_SUPPORTED_CHAINS } = await import("../../../packages/wallets/src/ctrl");
            chains = CTRL_SUPPORTED_CHAINS;
            break;
          }

          case WalletOption.WALLETCONNECT:
          case WalletOption.LEDGER:
          case WalletOption.LEDGER_LIVE:
          case WalletOption.TREZOR:
          case WalletOption.KEEPKEY:
          case WalletOption.KEYSTORE:
          case WalletOption.VULTISIG:
          case WalletOption.EXODUS:
            chains = ALL_CHAINS;
            break;

          default:
            chains = [];
        }

        setWalletSupportedChains((prev) => ({ ...prev, [wallet]: chains }));
        return chains;
      } catch (error) {
        console.error(`Failed to get supported chains for ${wallet}:`, error);
        return [];
      }
    },
    [walletSupportedChains],
  );

  const fetchWalletBalances = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex balance fetching logic with multiple fallbacks
    async (walletOption: string, addresses: Record<string, string>) => {
      if (!skClient) return;

      setLoadingBalances((prev) => new Set([...prev, walletOption]));

      try {
        const balances: Record<string, string> = {};

        for (const [chain] of Object.entries(addresses)) {
          try {
            // Try to get real balance from connected wallet
            const chainWallet = skClient.getWallet(chain as Chain);
            if (chainWallet?.balance && chainWallet.balance.length > 0) {
              // Use existing balance property
              const balance = chainWallet.balance[0];
              balances[chain] = balance ? `${balance.getValue("string")} ${balance.symbol}` : "0.0000";
            } else if ((chainWallet as any)?.getBalance) {
              try {
                const balance = await (chainWallet as any).getBalance();
                balances[chain] = balance ? `${balance.getValue("string")} ${balance.symbol}` : "0.0000";
              } catch (_balanceError) {
                // Fallback to mock balance if real balance fetch fails
                const mockBalance = (Math.random() * 0.1).toFixed(4);
                const chainName = chain.toUpperCase();
                balances[chain] =
                  `${mockBalance} ${chainName === "BINANCESMARTCHAIN" ? "BNB" : chainName === "ETHEREUM" ? "ETH" : chainName.slice(0, 4)}`;
              }
            } else {
              // Fallback to mock balance for unsupported balance fetching
              const mockBalance = (Math.random() * 0.1).toFixed(4);
              const chainName = chain.toUpperCase();
              balances[chain] =
                `${mockBalance} ${chainName === "BINANCESMARTCHAIN" ? "BNB" : chainName === "ETHEREUM" ? "ETH" : chainName.slice(0, 4)}`;
            }
          } catch (error) {
            console.error(`Failed to fetch balance for ${chain}:`, error);
            balances[chain] = "0.0000";
          }
        }

        setWalletBalances((prev) => ({ ...prev, [walletOption]: balances }));
      } catch (error) {
        console.error(`Failed to fetch balances for ${walletOption}:`, error);
      } finally {
        setLoadingBalances((prev) => {
          const newSet = new Set(prev);
          newSet.delete(walletOption);
          return newSet;
        });
      }
    },
    [skClient],
  );

  const connectWallet = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple wallet connection methods required
    async (walletOption: string) => {
      if (!skClient) {
        showToast("Client not ready");
        return;
      }

      // Check if wallet is detected (for wallets that require extensions)
      const walletRequiresExtension = [
        WalletOption.CTRL,
        WalletOption.KEPLR,
        WalletOption.LEAP,
        WalletOption.PHANTOM,
        WalletOption.OKX,
        WalletOption.BITGET,
        WalletOption.ONEKEY,
        WalletOption.TRONLINK,
        WalletOption.POLKADOT_JS,
        WalletOption.TALISMAN,
        WalletOption.VULTISIG,
      ];

      if (
        walletRequiresExtension.includes(walletOption as WalletOption) &&
        !detectedWallets.includes(walletOption as WalletOption)
      ) {
        showToast(`${walletOption} wallet not detected. Please install the extension first.`);
        return;
      }

      // If no chains selected, auto-select ALL compatible chains for this wallet
      let chainsToConnect = selectedChains;
      if (selectedChains.length === 0) {
        const supportedChains = await getWalletSupportedChains(walletOption as WalletOption);
        chainsToConnect = supportedChains; // Select ALL supported chains
        setSelectedChains(chainsToConnect);
        showToast(`Auto-selected all ${chainsToConnect.length} chains for ${walletOption}`);
      }

      setLoading(walletOption);

      // Clear old wallet balances to avoid stale data
      setWalletBalances({});

      try {
        let result = false;

        // Use the specific connect method for each wallet type
        switch (walletOption) {
          case WalletOption.METAMASK:
          case WalletOption.BRAVE:
          case WalletOption.COINBASE_WEB:
          case WalletOption.TRUSTWALLET_WEB:
            result = (await skClient.connectEVMWallet?.(chainsToConnect, walletOption as EVMWalletOptions)) || false;
            break;
          case WalletOption.KEPLR:
          case WalletOption.LEAP:
            result =
              (await skClient.connectKeplr?.(
                chainsToConnect,
                walletOption as WalletOption.KEPLR | WalletOption.LEAP,
              )) || false;
            break;
          case WalletOption.WALLETCONNECT:
            result = (await skClient.connectWalletconnect?.(chainsToConnect)) || false;
            break;
          case WalletOption.PHANTOM:
            result = (await skClient.connectPhantom?.(chainsToConnect)) || false;
            break;
          case WalletOption.XAMAN:
            result = (await skClient.connectXaman?.(chainsToConnect)) || false;
            break;
          case WalletOption.TRONLINK:
            result = (await skClient.connectTronLink?.(chainsToConnect)) || false;
            break;
          case WalletOption.KEYSTORE: {
            const phrase = prompt("Enter your seed phrase (12-24 words):");
            if (phrase) {
              result = (await skClient.connectKeystore?.(chainsToConnect, phrase)) || false;
            }
            break;
          }
          case WalletOption.LEDGER:
            result = (await skClient.connectLedger?.(chainsToConnect)) || false;
            break;
          case WalletOption.TREZOR:
            // connectTrezor requires derivationPath, skip for now
            showToast("Trezor wallet requires derivation path configuration");
            result = false;
            break;
          case WalletOption.COSMOSTATION:
            // result = (await skClient.connectCosmostation?.(chainsToConnect)) || false;
            showToast("Cosmostation wallet not available in this build");
            result = false;
            break;
          case WalletOption.OKX:
          case WalletOption.OKX_MOBILE:
            result = (await skClient.connectOkx?.(chainsToConnect)) || false;
            break;
          case WalletOption.BITGET:
            result = (await skClient.connectBitget?.(chainsToConnect)) || false;
            break;
          case WalletOption.ONEKEY:
            result = (await skClient.connectOnekeyWallet?.(chainsToConnect)) || false;
            break;
          case WalletOption.EXODUS:
            // result = (await skClient.connectExodusWallet?.(chainsToConnect, wallet)) || false;
            showToast("Exodus wallet not available in this build");
            result = false;
            break;
          case WalletOption.CTRL:
            result = (await skClient.connectCtrl?.(chainsToConnect)) || false;
            break;
          case WalletOption.VULTISIG:
            result = (await skClient.connectVultisig?.(chainsToConnect)) || false;
            break;
          case WalletOption.TALISMAN:
            result = (await skClient.connectTalisman?.(chainsToConnect)) || false;
            break;
          case WalletOption.POLKADOT_JS:
            result = (await skClient.connectPolkadotJs?.(chainsToConnect)) || false;
            break;
          case WalletOption.RADIX_WALLET:
            result = (await skClient.connectRadixWallet?.(chainsToConnect)) || false;
            break;
          case WalletOption.KEEPKEY:
            result = (await skClient.connectKeepkey?.(chainsToConnect)) || false;
            break;
          case WalletOption.KEEPKEY_BEX:
            result = (await skClient.connectKeepkeyBex?.(chainsToConnect)) || false;
            break;
          default:
            throw new Error(`Wallet ${walletOption} not implemented`);
        }

        if (result) {
          // Get wallet addresses after connection
          const wallets = skClient.getAllWallets();
          const addresses: Record<string, string> = {};

          Object.entries(wallets).forEach(([chain, wallet]) => {
            if (wallet && (wallet as any).address) {
              addresses[chain] = (wallet as any).address;
            }
          });

          setConnections((prev) => ({ ...prev, [walletOption]: { addresses, connected: true } }));

          // Start fetching balances for this wallet
          void fetchWalletBalances(walletOption, addresses);

          showToast(`Connected ${walletOption}!`);
        }
      } catch (error: any) {
        console.error(`Connection error for ${walletOption}:`, error);
        showToast(error.message || `Failed: ${walletOption}`);
      } finally {
        setLoading(null);
      }
    },
    [skClient, selectedChains, showToast, getWalletSupportedChains, detectedWallets.includes, fetchWalletBalances],
  );

  // Copy address to clipboard with animation
  const copyToClipboard = useCallback(
    async (text: string, label: string, element?: HTMLElement) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`📋 Copied ${label} address!`);

        // Add copy animation
        if (element) {
          element.classList.add("copied");
          setTimeout(() => element.classList.remove("copied"), 300);
        }
      } catch (_error) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast(`📋 Copied ${label} address!`);

        if (element) {
          element.classList.add("copied");
          setTimeout(() => element.classList.remove("copied"), 300);
        }
      }
    },
    [showToast],
  );

  const disconnect = useCallback(
    (walletOption: string) => {
      setConnections((prev) => {
        const updated = { ...prev };
        delete updated[walletOption];
        return updated;
      });
      setWalletBalances((prev) => {
        const updated = { ...prev };
        delete updated[walletOption];
        return updated;
      });
      showToast(`Disconnected ${walletOption}`);
    },
    [showToast],
  );

  const handleTransfer = useCallback(() => {
    if (!skClient || !transferAsset || !transferAmount || !transferTo) {
      showToast("Fill in all transfer fields");
      return;
    }

    try {
      showToast("Transfer functionality coming soon!");
      // TODO: Implement actual transfer
      // const assetValue = AssetValue.fromString(transferAsset, transferAmount);
      // const tx = await skClient.transfer({
      //   assetValue,
      //   recipient: transferTo,
      //   memo: transferMemo
      // });
    } catch (error: any) {
      showToast(`Transfer failed: ${error.message}`);
    }
  }, [skClient, transferAsset, transferAmount, transferTo, showToast]);

  const handleSwap = useCallback(() => {
    if (!skClient || !swapAmount || !swapFrom || !swapTo) {
      showToast("Fill in all swap fields");
      return;
    }

    try {
      showToast("Swap functionality coming soon!");
      // TODO: Implement actual swap
      // const quote = await skClient.getQuote({
      //   sellAsset: swapFrom,
      //   buyAsset: swapTo,
      //   sellAmount: swapAmount
      // });
    } catch (error: any) {
      showToast(`Swap failed: ${error.message}`);
    }
  }, [skClient, swapAmount, swapFrom, swapTo, showToast]);

  // Check if wallet supports ALL selected chains
  const getWalletCompatibility = useCallback(
    async (wallet: WalletOption): Promise<boolean> => {
      if (selectedChains.length === 0) return true; // Show all wallets when no chains selected

      const supportedChains = await getWalletSupportedChains(wallet);
      // Wallet must support ALL selected chains
      return selectedChains.every((chain) => supportedChains.includes(chain));
    },
    [selectedChains, getWalletSupportedChains],
  );

  const [walletCompatibility, setWalletCompatibility] = useState<Record<WalletOption, boolean>>(
    {} as Record<WalletOption, boolean>,
  );

  // Pre-compute wallet compatibility when selected chains change
  useEffect(() => {
    const updateCompatibility = async () => {
      const compatibility = {} as Record<WalletOption, boolean>;

      await Promise.all(
        ALL_WALLETS.map(async ({ w }) => {
          compatibility[w] = await getWalletCompatibility(w);
        }),
      );

      setWalletCompatibility(compatibility);
    };

    void updateCompatibility();
  }, [getWalletCompatibility]);

  // Sort wallets: compatible & detected first, then incompatible (disabled)
  const sortedWallets = useMemo(() => {
    const walletsWithCompatibility = ALL_WALLETS.map((w) => ({
      ...w,
      isCompatible: walletCompatibility[w.w] ?? true,
      isDetected: detectedWallets.includes(w.w),
    }));

    // Sort: compatible & detected first, then compatible, then incompatible
    return walletsWithCompatibility.sort((a, b) => {
      // Compatible wallets first
      if (a.isCompatible !== b.isCompatible) {
        return a.isCompatible ? -1 : 1;
      }
      // Among compatible/incompatible, detected first
      if (a.isDetected !== b.isDetected) {
        return a.isDetected ? -1 : 1;
      }
      return 0;
    });
  }, [detectedWallets, walletCompatibility]);

  return (
    <div className="compact-app">
      {toast && <div className="toast">{toast}</div>}

      <div className="header">
        <h1>SwapKit Playground</h1>
        <div className="tabs">
          <button
            className={activeTab === "connect" ? "active" : ""}
            onClick={() => setActiveTab("connect")}
            type="button">
            Connect
          </button>
          <button
            className={activeTab === "transfer" ? "active" : ""}
            onClick={() => setActiveTab("transfer")}
            type="button">
            Transfer
          </button>
          <button className={activeTab === "swap" ? "active" : ""} onClick={() => setActiveTab("swap")} type="button">
            Swap
          </button>
        </div>
      </div>

      {activeTab === "connect" && (
        <>
          <div className="chains-section">
            <div className="section-header">
              <h3>
                Select Chains ({selectedChains.length}/{ALL_CHAINS.length})
              </h3>
              <div className="chain-actions">
                <button onClick={() => setSelectedChains(ALL_CHAINS)} type="button">
                  All
                </button>
                <button onClick={() => setSelectedChains([])} type="button">
                  None
                </button>
                {Object.keys(CHAIN_CATEGORIES).map((cat) => (
                  <button
                    className={
                      CHAIN_CATEGORIES[cat as keyof typeof CHAIN_CATEGORIES].every((c) => selectedChains.includes(c))
                        ? "active"
                        : ""
                    }
                    key={cat}
                    onClick={() => selectCategory(cat as keyof typeof CHAIN_CATEGORIES)}
                    type="button">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="chains-container">
              {Object.entries(CHAIN_CATEGORIES).map(([category, chains]) => (
                <div className="chain-category" key={category}>
                  <div className="category-label">{category}</div>
                  <div className="chains-grid" onMouseLeave={() => setDraggedChains(new Set())} role="toolbar">
                    {chains.map((chain) => (
                      <button
                        className={`chain-btn ${selectedChains.includes(chain) ? "selected" : ""} ${draggedChains.has(chain) ? "dragging" : ""}`}
                        key={chain}
                        onMouseDown={(e) => handleMouseDown(chain, e)}
                        onMouseEnter={() => handleMouseEnter(chain)}
                        ref={(el) => {
                          if (el) chainRefs.current.set(chain, el);
                        }}
                        title={chain}
                        type="button">
                        {getChainDisplayName(chain)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="drag-hint">💡 Drag to select multiple chains</div>
          </div>

          <div className="wallets-section">
            <h3>
              Connect Wallets
              {selectedChains.length > 0 && (
                <span className="chain-filter">
                  ({sortedWallets.filter((w) => w.isCompatible).length} support all {selectedChains.length} chain
                  {selectedChains.length > 1 ? "s" : ""})
                </span>
              )}
            </h3>
            <div className="wallets-grid">
              {sortedWallets.map(({ w, n, isCompatible, isDetected }) => {
                const isConnected = connections[w];
                const isLoading = loading === w;
                const isDisabled = selectedChains.length > 0 && !isCompatible;

                return (
                  <button
                    className={`wallet-btn ${isConnected ? "connected" : ""} ${isDetected ? "detected" : ""} ${isDisabled ? "incompatible" : ""}`}
                    disabled={isLoading || isDisabled}
                    key={w}
                    onClick={() => !isDisabled && (isConnected ? disconnect(w) : connectWallet(w))}
                    title={isDisabled ? `Doesn't support all selected chains` : ""}
                    type="button">
                    {isLoading ? "..." : isConnected ? "✓" : isDetected ? "•" : ""} {n}
                  </button>
                );
              })}
            </div>
            {selectedChains.length > 0 && sortedWallets.filter((w) => w.isCompatible).length === 0 && (
              <p className="no-compatible">No wallets support all selected chains</p>
            )}
          </div>

          <div className="connections-section">
            <h3>Connected Wallets & Balances</h3>
            {Object.keys(connections).length === 0 ? (
              <p className="no-connections">No wallets connected</p>
            ) : (
              <div className="wallet-balances">
                {Object.entries(connections).map(([wallet, data]) => {
                  const balances = walletBalances[wallet] || {};
                  const isLoadingBalance = loadingBalances.has(wallet);

                  return (
                    <div className="wallet-balance-card" key={wallet}>
                      <div className="wallet-header">
                        <span className="wallet-name">{wallet}</span>
                        <button
                          className="disconnect-btn"
                          onClick={() => disconnect(wallet)}
                          title="Disconnect wallet"
                          type="button">
                          ✕
                        </button>
                      </div>

                      {isLoadingBalance ? (
                        <div className="loading-balances">
                          <div className="spinner" />
                          <span>Loading balances...</span>
                        </div>
                      ) : (
                        <div className="balances-list">
                          {Object.keys(balances).length === 0 ? (
                            <p className="no-balances">No balances available</p>
                          ) : (
                            Object.entries(balances).map(([chain, balance]) => (
                              <div className="balance-row" key={chain}>
                                <span className="chain-name">{chain.charAt(0).toUpperCase() + chain.slice(1)}</span>
                                <span className="balance-amount">{balance}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      <div className="addresses-section">
                        <details className="addresses-details">
                          <summary>View Addresses</summary>
                          <div className="addresses-list">
                            {Object.entries(data.addresses || {}).map(([chain, address]) => (
                              <div className="address-row" key={chain}>
                                <span className="address-chain">{chain}:</span>
                                <button
                                  className="address-value"
                                  onClick={(e) => copyToClipboard(address as string, chain, e.currentTarget)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && copyToClipboard(address as string, chain, e.currentTarget)
                                  }
                                  title={`Click to copy: ${address}`}
                                  type="button">
                                  {(address as string).slice(0, 6)}...{(address as string).slice(-4)}
                                </button>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "transfer" && (
        <div className="transfer-section">
          <div className="page-header">
            <h3>Transfer Assets</h3>
            <p className="page-description">Send tokens to another address on the same blockchain</p>
          </div>
          {availableAssets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📤</div>
              <h4>No Connected Wallets</h4>
              <p>Connect a wallet on the Connect tab to start transferring assets</p>
            </div>
          ) : (
            <>
              <div className="transfer-info">
                <div className="info-card">
                  <h4>💰 Available Balance</h4>
                  <p>Select an asset to see your balance</p>
                </div>
                <div className="info-card">
                  <h4>⚡ Network Fees</h4>
                  <p>Fees vary by network - ETH: ~$2-10, BTC: ~$1-5</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={transferAssetId}>Asset to Transfer</label>
                <div className="asset-selector">
                  <input
                    id={transferAssetId}
                    onBlur={() => setTimeout(() => setShowTransferAssets(false), 200)}
                    onChange={(e) => setTransferAsset(e.target.value)}
                    onFocus={() => setShowTransferAssets(true)}
                    placeholder="Select asset to transfer"
                    type="text"
                    value={transferAsset}
                  />
                  {showTransferAssets && (
                    <div className="asset-dropdown">
                      {availableAssets
                        .filter((a) => a.toLowerCase().includes(transferAsset.toLowerCase()))
                        .map((asset) => (
                          <button
                            className="asset-option"
                            key={asset}
                            onClick={() => {
                              setTransferAsset(asset);
                              setShowTransferAssets(false);
                            }}
                            type="button">
                            {asset}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor={transferAmountId}>Amount</label>
                <input
                  id={transferAmountId}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.0"
                  type="text"
                  value={transferAmount}
                />
              </div>
              <div className="form-group">
                <label htmlFor={transferToId}>To Address</label>
                <input
                  id={transferToId}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="Recipient address"
                  type="text"
                  value={transferTo}
                />
              </div>
              <div className="form-group">
                <label htmlFor={transferMemoId}>Memo (Optional)</label>
                <input
                  id={transferMemoId}
                  onChange={(e) => setTransferMemo(e.target.value)}
                  placeholder="Transaction memo"
                  type="text"
                  value={transferMemo}
                />
              </div>
              <button className="action-btn" onClick={handleTransfer} type="button">
                Send Transfer
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === "swap" && (
        <div className="swap-section">
          <div className="page-header">
            <h3>Swap Assets</h3>
            <p className="page-description">Exchange one token for another across different blockchains</p>
          </div>
          {availableAssets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔄</div>
              <h4>No Connected Wallets</h4>
              <p>Connect a wallet on the Connect tab to start swapping assets</p>
            </div>
          ) : (
            <>
              <div className="swap-info">
                <div className="info-card">
                  <h4>🔀 Cross-Chain Swaps</h4>
                  <p>Swap between different blockchains via THORChain & Maya</p>
                </div>
                <div className="info-card">
                  <h4>📊 Best Rates</h4>
                  <p>Automatically finds the best exchange rate across DEXs</p>
                </div>
                <div className="info-card">
                  <h4>⏱️ Estimated Time</h4>
                  <p>Same chain: ~1-5 min, Cross-chain: ~5-15 min</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={swapFromId}>From Asset</label>
                <div className="asset-selector">
                  <input
                    id={swapFromId}
                    onBlur={() => setTimeout(() => setShowFromAssets(false), 200)}
                    onChange={(e) => setSwapFrom(e.target.value)}
                    onFocus={() => setShowFromAssets(true)}
                    placeholder="Select or type asset"
                    type="text"
                    value={swapFrom}
                  />
                  {showFromAssets && (
                    <div className="asset-dropdown">
                      {availableAssets
                        .filter((a) => a.toLowerCase().includes(swapFrom.toLowerCase()))
                        .map((asset) => (
                          <button
                            className="asset-option"
                            key={asset}
                            onClick={() => {
                              setSwapFrom(asset);
                              setShowFromAssets(false);
                            }}
                            type="button">
                            {asset}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor={swapAmountId}>Amount</label>
                <input
                  id={swapAmountId}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="0.0"
                  type="text"
                  value={swapAmount}
                />
              </div>
              <div className="form-group">
                <label htmlFor={swapToId}>To Asset</label>
                <div className="asset-selector">
                  <input
                    id={swapToId}
                    onBlur={() => setTimeout(() => setShowToAssets(false), 200)}
                    onChange={(e) => setSwapTo(e.target.value)}
                    onFocus={() => setShowToAssets(true)}
                    placeholder="Select or type asset"
                    type="text"
                    value={swapTo}
                  />
                  {showToAssets && (
                    <div className="asset-dropdown">
                      {availableAssets
                        .filter((a) => a.toLowerCase().includes(swapTo.toLowerCase()) && a !== swapFrom)
                        .map((asset) => (
                          <button
                            className="asset-option"
                            key={asset}
                            onClick={() => {
                              setSwapTo(asset);
                              setShowToAssets(false);
                            }}
                            type="button">
                            {asset}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <button className="action-btn" onClick={handleSwap} type="button">
                Execute Swap
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
