export const SwapArrowsIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Swap"
    aria-hidden="true"
  >
    <title>Swap</title>
    <circle cx="16" cy="16" r="16" fill="white" />
    <path
      d="M8 13.3333V6.66667M8 13.3333L5.5 10.8333M8 13.3333L10.5 10.8333"
      stroke="#141514"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(4 4)"
    />
    <path
      d="M15 6.66667V13.3333M15 6.66667L12.5 9.16667M15 6.66667L17.5 9.16667"
      stroke="#141514"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(4 4)"
    />
  </svg>
);

export const ChevronIcon = () => (
  <svg
    className="w-4 h-4 text-white/60"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Chevron"
    aria-hidden="true"
  >
    <title>Chevron</title>
    <path
      d="M6 12L10 8L6 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Expand"
    aria-hidden="true"
  >
    <title>Expand</title>
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronUpIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Collapse"
    aria-hidden="true"
  >
    <title>Collapse</title>
    <path
      d="M9 7.5L6 4.5L3 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Close"
    aria-hidden="true"
  >
    <title>Close</title>
    <path
      d="M18 6L6 18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 6L18 18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Check"
    aria-hidden="true"
  >
    <title>Check</title>
    <path
      d="M10 3L4.5 8.5L2 6"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Search"
    aria-hidden="true"
  >
    <title>Search</title>
    <path
      d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 14L11.1 11.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ProviderIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Provider"
    aria-hidden="true"
  >
    <title>Provider</title>
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 5V8L10 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronRightIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Chevron Right"
    aria-hidden="true"
  >
    <title>Chevron Right</title>
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WalletIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Wallet"
    aria-hidden="true"
  >
    <title>Wallet</title>
    <path
      d="M1.5 2.5V13.5H14.5V5.5H12.5C11.5 5.5 10.5 4.5 10.5 3.5V2.5H1.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 8.5H14.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Clock"
    aria-hidden="true"
  >
    <title>Clock</title>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 4V8L10.5 10.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MetaMaskIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="MetaMask"
  >
    <title>MetaMask</title>
    <rect width="40" height="40" rx="8" fill="#F6851B" />
    <path
      d="M30.2545 9L19.0545 17.2727L21.0182 12.6545L30.2545 9Z"
      fill="#E2761B"
      stroke="#E2761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.74546 9L20.8545 17.3455L19.0182 12.6545L9.74546 9Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26.5636 25.0909L23.6727 29.5636L29.8545 31.2182L31.5818 25.1818L26.5636 25.0909Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.43637 25.1818L10.1455 31.2182L16.3273 29.5636L13.4364 25.0909L8.43637 25.1818Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.0182 19.8727L14.3636 22.4364L20.9455 22.7273L20.7273 15.6364L16.0182 19.8727Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23.9818 19.8727L19.2 15.5636L19.0545 22.7273L25.6364 22.4364L23.9818 19.8727Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.3273 29.5636L20.5636 27.5091L16.9091 25.2364L16.3273 29.5636Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4364 27.5091L23.6727 29.5636L23.0909 25.2364L19.4364 27.5091Z"
      fill="#E4761B"
      stroke="#E4761B"
      strokeWidth="0.0909091"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CoinbaseIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Coinbase"
  >
    <title>Coinbase</title>
    <rect width="40" height="40" rx="8" fill="#0052FF" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20 30C25.5228 30 30 25.5228 30 20C30 14.4772 25.5228 10 20 10C14.4772 10 10 14.4772 10 20C10 25.5228 14.4772 30 20 30ZM18 16C16.8954 16 16 16.8954 16 18V22C16 23.1046 16.8954 24 18 24H22C23.1046 24 24 23.1046 24 22V18C24 16.8954 23.1046 16 22 16H18Z"
      fill="white"
    />
  </svg>
);

export const TrustWalletIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Trust Wallet"
  >
    <title>Trust Wallet</title>
    <rect width="40" height="40" rx="8" fill="#3375BB" />
    <path
      d="M20 8C20 8 27.5 10.5 28 11C28.5 11.5 28.5 20 28.5 20C28.5 20 28.5 28.5 28 29C27.5 29.5 20 32 20 32C20 32 12.5 29.5 12 29C11.5 28.5 11.5 20 11.5 20C11.5 20 11.5 11.5 12 11C12.5 10.5 20 8 20 8Z"
      fill="white"
    />
  </svg>
);

export const PhantomIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Phantom"
  >
    <title>Phantom</title>
    <rect width="40" height="40" rx="8" fill="#AB9FF2" />
    <path
      d="M30 20C30 25.523 25.523 30 20 30C14.477 30 10 25.523 10 20C10 14.477 10 10 20 10C30 10 30 14.477 30 20Z"
      fill="white"
    />
    <circle cx="16" cy="18" r="2" fill="#AB9FF2" />
    <circle cx="24" cy="18" r="2" fill="#AB9FF2" />
  </svg>
);

export const BitgetIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Bitget"
  >
    <title>Bitget</title>
    <rect width="40" height="40" rx="8" fill="#00D4D4" />
    <path d="M10 10H20V20H10V10Z" fill="white" />
    <path d="M20 20H30V30H20V20Z" fill="white" />
    <path d="M15 20H25V25H15V20Z" fill="white" />
  </svg>
);

export const OneKeyIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="OneKey"
  >
    <title>OneKey</title>
    <rect width="40" height="40" rx="8" fill="#00B812" />
    <path
      d="M20 10C14.48 10 10 14.48 10 20C10 25.52 14.48 30 20 30C25.52 30 30 25.52 30 20C30 14.48 25.52 10 20 10ZM20 26C16.69 26 14 23.31 14 20C14 16.69 16.69 14 20 14C23.31 14 26 16.69 26 20C26 23.31 23.31 26 20 26Z"
      fill="white"
    />
  </svg>
);

export const TalismanIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Talisman"
  >
    <title>Talisman</title>
    <rect width="40" height="40" rx="8" fill="#D5FF5C" />
    <path d="M20 10L25 15L30 20L25 25L20 30L15 25L10 20L15 15L20 10Z" fill="#151515" />
    <circle cx="20" cy="20" r="5" fill="#D5FF5C" />
  </svg>
);

export const ExodusIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Exodus"
  >
    <title>Exodus</title>
    <rect width="40" height="40" rx="8" fill="#6B5FE8" />
    <path d="M20 8L30 20L20 32L10 20L20 8Z" fill="white" />
    <path d="M20 14L24 20L20 26L16 20L20 14Z" fill="#6B5FE8" />
  </svg>
);

export const WalletConnectIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="WalletConnect"
  >
    <title>WalletConnect</title>
    <rect width="40" height="40" rx="8" fill="#3B99FC" />
    <path
      d="M13.4 15.6C17.0667 11.9333 22.9333 11.9333 26.6 15.6L27.0667 16.0667C27.2667 16.2667 27.2667 16.6 27.0667 16.8L25.5333 18.3333C25.4333 18.4333 25.2667 18.4333 25.1667 18.3333L24.5333 17.7C21.9333 15.1 17.6667 15.1 15.0667 17.7L14.3667 18.4C14.2667 18.5 14.1 18.5 14 18.4L12.4667 16.8667C12.2667 16.6667 12.2667 16.3333 12.4667 16.1333L13.4 15.6ZM29.7333 18.7333L31.1333 20.1333C31.3333 20.3333 31.3333 20.6667 31.1333 20.8667L24.8 27.2C24.6 27.4 24.2667 27.4 24.0667 27.2L19.2 22.3333C19.15 22.2833 19.0833 22.2833 19.0333 22.3333L14.1667 27.2C13.9667 27.4 13.6333 27.4 13.4333 27.2L7.06667 20.8333C6.86667 20.6333 6.86667 20.3 7.06667 20.1L8.46667 18.7C8.66667 18.5 9 18.5 9.2 18.7L14.0667 23.5667C14.1167 23.6167 14.1833 23.6167 14.2333 23.5667L19.1 18.7C19.3 18.5 19.6333 18.5 19.8333 18.7L24.7 23.5667C24.75 23.6167 24.8167 23.6167 24.8667 23.5667L29.7333 18.7333Z"
      fill="white"
    />
  </svg>
);

// Chain Icons
export const AllChainsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="5" cy="5" r="3" fill="#FF5E18" />
    <circle cx="15" cy="5" r="3" fill="#627EEA" />
    <circle cx="5" cy="15" r="3" fill="#8247E5" />
    <circle cx="15" cy="15" r="3" fill="#00D4AA" />
  </svg>
);
