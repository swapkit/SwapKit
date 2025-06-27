import { memo, useCallback, useEffect, useState } from "react";
import {
  BitgetIcon,
  CloseIcon,
  CoinbaseIcon,
  ExodusIcon,
  MetaMaskIcon,
  OneKeyIcon,
  PhantomIcon,
  SearchIcon,
  TalismanIcon,
  TrustWalletIcon,
} from "./icons";

export interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
  category?: "mobile" | "software" | "hardware" | "keystore";
  logoUrl?: string;
}

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: WalletOption) => void;
  searchEnabled?: boolean;
  categoriesEnabled?: boolean;
}

// OKX Wallet Icon
const OKXIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="OKX"
  >
    <title>OKX</title>
    <rect width="40" height="40" rx="8" fill="#000000" />
    <path d="M25 15H30V20H25V15Z" fill="white" />
    <path d="M20 20H25V25H20V20Z" fill="white" />
    <path d="M15 25H20V30H15V25Z" fill="white" />
    <path d="M10 20H15V25H10V20Z" fill="white" />
    <path d="M15 15H20V20H15V15Z" fill="white" />
  </svg>
);

// Brave Wallet Icon
const BraveIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Brave"
  >
    <title>Brave</title>
    <rect width="40" height="40" rx="8" fill="#FB542B" />
    <path d="M20 8L26 11V20C26 25 23 28 20 30C17 28 14 25 14 20V11L20 8Z" fill="white" />
  </svg>
);

// Ledger Icon (for hardware section)
const LedgerIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Ledger"
  >
    <title>Ledger</title>
    <rect width="40" height="40" rx="8" fill="#000000" />
    <path d="M10 10H20V12H10V10Z" fill="white" />
    <path d="M10 10H12V30H10V10Z" fill="white" />
    <path d="M28 10H30V30H28V10Z" fill="white" />
    <path d="M20 28H30V30H20V28Z" fill="white" />
    <path d="M28 10H30V12H28V10Z" fill="white" />
  </svg>
);

// Keystore Icon
const KeystoreIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Keystore"
  >
    <title>Keystore</title>
    <rect width="40" height="40" rx="8" fill="#2C3E50" />
    <path
      d="M20 12C16.69 12 14 14.69 14 18C14 21.31 16.69 24 20 24C20.7 24 21.37 23.84 21.99 23.56L26 27.59V28H28V26H30V24H28.41L24.44 20.01C24.72 19.38 24.88 18.7 24.88 18C24.88 14.69 22.19 12 20 12ZM20 14C21.1 14 22 14.9 22 16C22 17.1 21.1 18 20 18C18.9 18 18 17.1 18 16C18 14.9 18.9 14 20 14Z"
      fill="white"
    />
  </svg>
);

const allWalletOptions: WalletOption[] = [
  // Mobile wallets
  {
    id: "coinbase",
    name: "Coinbase",
    icon: <CoinbaseIcon className="w-full h-full" />,
    category: "mobile",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/coinbase.png",
  },
  {
    id: "okx",
    name: "OKX",
    icon: <OKXIcon className="w-full h-full" />,
    category: "mobile",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/okx.png",
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: <MetaMaskIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/metamask.png",
  },
  {
    id: "trustwallet",
    name: "Trust wallet",
    icon: <TrustWalletIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/trust.png",
  },
  {
    id: "bitget",
    name: "Bitget",
    icon: <BitgetIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/bitget.png",
  },
  {
    id: "brave",
    name: "Brave",
    icon: <BraveIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/brave.png",
  },
  {
    id: "onekey",
    name: "Onekey",
    icon: <OneKeyIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/onekey.png",
  },
  {
    id: "talisman",
    name: "Talisman",
    icon: <TalismanIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/talisman.png",
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: <PhantomIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/phantom.png",
  },
  {
    id: "exodus",
    name: "Exodus",
    icon: <ExodusIcon className="w-full h-full" />,
    category: "software",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/exodus.png",
  },
  // Hardware wallet
  {
    id: "ledger",
    name: "Ledger",
    icon: <LedgerIcon className="w-full h-full" />,
    category: "hardware",
    logoUrl: "https://storage.googleapis.com/token-list-swapkit/images/ledger.png",
  },
];

// Bottom action buttons
const bottomActions = [
  {
    id: "keystore",
    name: "Keystore",
    icon: <KeystoreIcon className="w-10 h-10" />,
  },
  {
    id: "import-phrase",
    name: "Import phrase",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#34495E" />
        <path d="M14 20H26M20 14V26" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "create",
    name: "Create",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#27AE60" />
        <path d="M20 14L22 19L27 20L22 21L20 26L18 21L13 20L18 19L20 14Z" fill="white" />
      </svg>
    ),
  },
];

export const WalletConnectModal = memo(function WalletConnectModal({
  isOpen,
  onClose,
  onConnect,
  searchEnabled = true,
}: WalletConnectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleWalletSelect = useCallback(
    (wallet: WalletOption) => {
      onConnect(wallet);
    },
    [onConnect],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredWallets = searchQuery
    ? allWalletOptions.filter((wallet) =>
        wallet.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allWalletOptions;

  const mobileWallets = filteredWallets.filter((w) => w.category === "mobile");
  const softwareWallets = filteredWallets.filter((w) => w.category === "software");
  const hardwareWallets = filteredWallets.filter((w) => w.category === "hardware");

  // Show only first 8 wallets in initial view
  const initialWallets = showSearch ? filteredWallets : allWalletOptions.slice(0, 8);

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div className="bg-[#202120] rounded-2xl w-full max-w-[420px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 pb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-text-primary">Connect wallet</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-background-hover rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        {showSearch && searchEnabled && (
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-background-surface border border-border-secondary rounded-lg pl-10 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-primary"
                // autoFocus - removed for accessibility
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                <SearchIcon />
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {showSearch ? (
            <div className="space-y-6">
              {/* Mobile wallets */}
              {mobileWallets.length > 0 && (
                <div>
                  <h3 className="text-sm text-text-tertiary mb-3">Mobile wallets</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {mobileWallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => handleWalletSelect(wallet)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background-hover transition-colors group"
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          {wallet.icon}
                        </div>
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors text-center">
                          {wallet.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Software wallets */}
              {softwareWallets.length > 0 && (
                <div>
                  <h3 className="text-sm text-text-tertiary mb-3">Software wallets</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {softwareWallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => handleWalletSelect(wallet)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background-hover transition-colors group"
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          {wallet.icon}
                        </div>
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors text-center">
                          {wallet.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hardware wallets */}
              {hardwareWallets.length > 0 && (
                <div>
                  <h3 className="text-sm text-text-tertiary mb-3">Hardware wallets</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {hardwareWallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => handleWalletSelect(wallet)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background-hover transition-colors group"
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          {wallet.icon}
                        </div>
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors text-center">
                          {wallet.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keystore section (bottom actions) */}
              <div className="border-t border-border-primary pt-4">
                <h3 className="text-sm text-text-tertiary mb-3">Keystore</h3>
                <div className="flex gap-4 justify-center">
                  {bottomActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleWalletSelect({ ...action, category: "keystore" })}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background-hover transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        {action.icon}
                      </div>
                      <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors text-center">
                        {action.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hide wallets button */}
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="4" height="4" fill="currentColor" />
                  <rect x="9" y="3" width="4" height="4" fill="currentColor" />
                  <rect x="3" y="9" width="4" height="4" fill="currentColor" />
                  <rect x="9" y="9" width="4" height="4" fill="currentColor" />
                </svg>
                <span className="text-sm font-medium">Hide wallets</span>
              </button>
            </div>
          ) : (
            <>
              {/* Initial grid view */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {initialWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => handleWalletSelect(wallet)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background-hover transition-colors group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">{wallet.icon}</div>
                    <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors text-center">
                      {wallet.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Show all wallets button */}
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="4" height="4" fill="currentColor" />
                  <rect x="9" y="3" width="4" height="4" fill="currentColor" />
                  <rect x="3" y="9" width="4" height="4" fill="currentColor" />
                  <rect x="9" y="9" width="4" height="4" fill="currentColor" />
                </svg>
                <span className="text-sm font-medium">Show wallets</span>
              </button>
            </>
          )}

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-text-tertiary">
            By connecting your wallet, you agree
            <br />
            to our{" "}
            <a href="https://swapkit.dev/terms" className="text-accent-primary hover:underline">
              Terms of Use
            </a>
            {" and "}
            <a href="https://swapkit.dev/privacy" className="text-accent-primary hover:underline">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
});
