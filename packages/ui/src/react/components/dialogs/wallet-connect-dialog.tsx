"use client";

import { Chain, EVMChains, WalletOption } from "@swapkit/helpers";
import { BITGET_SUPPORTED_CHAINS } from "@swapkit/wallets/bitget";
import { PHANTOM_SUPPORTED_CHAINS } from "@swapkit/wallets/phantom";
import { SearchIcon, WalletMinimalIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { match, P } from "ts-pattern";
import { showModal, useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { SWAPKIT_WIDGET_TOASTER_ID } from "../ui/sonner";
import { WalletIcon } from "../wallet-icon";
import { WalletKeystoreConnectDialog } from "./wallet-keystore-connect-dialog";

const WALLET_GROUPS = {
  "Browser Extensions": [
    WalletOption.METAMASK,
    WalletOption.PHANTOM,
    WalletOption.KEPLR,
    WalletOption.EXODUS,
    WalletOption.BRAVE,
    WalletOption.OKX,
    WalletOption.ONEKEY,
    WalletOption.LEAP,
    WalletOption.POLKADOT_JS,
    WalletOption.TALISMAN,
    WalletOption.EIP6963,
  ],
  "Hardware Wallets": [
    WalletOption.LEDGER,
    WalletOption.LEDGER_LIVE,
    WalletOption.TREZOR,
    WalletOption.KEEPKEY,
    WalletOption.KEEPKEY_BEX,
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

const AllChainsSupported = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Polkadot,
  Chain.Maya,
  Chain.Kujira,
  Chain.THORChain,
  Chain.Solana,
];

export const availableChainsByWallet: Record<WalletOption, Chain[] | readonly Chain[]> = {
  [WalletOption.BITGET]: BITGET_SUPPORTED_CHAINS,
  [WalletOption.BRAVE]: EVMChains,
  [WalletOption.COINBASE_MOBILE]: EVMChains,
  [WalletOption.COINBASE_WEB]: EVMChains,
  [WalletOption.EIP6963]: EVMChains,
  [WalletOption.KEPLR]: [Chain.Cosmos, Chain.Kujira],
  [WalletOption.LEAP]: [Chain.Cosmos, Chain.Kujira],
  [WalletOption.LEDGER]: AllChainsSupported,
  [WalletOption.METAMASK]: EVMChains,
  [WalletOption.OKX_MOBILE]: EVMChains,
  [WalletOption.ONEKEY]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Ethereum,
    Chain.Optimism,
    Chain.Polygon,
    Chain.Solana,
  ],
  [WalletOption.PHANTOM]: PHANTOM_SUPPORTED_CHAINS,
  [WalletOption.POLKADOT_JS]: [Chain.Polkadot],
  [WalletOption.TRUSTWALLET_WEB]: EVMChains,
  [WalletOption.CTRL]: AllChainsSupported,
  [WalletOption.KEYSTORE]: [...AllChainsSupported, Chain.Polkadot],
  [WalletOption.KEEPKEY]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
    Chain.Maya,
  ],
  [WalletOption.KEEPKEY_BEX]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Base,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
    Chain.Maya,
  ],
  [WalletOption.TREZOR]: [
    Chain.Base,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Litecoin,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Optimism,
    Chain.Arbitrum,
    Chain.Polygon,
  ],
  [WalletOption.WALLETCONNECT]: [
    Chain.Ethereum,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Avalanche,
    Chain.THORChain,
    Chain.Maya,
    Chain.Polygon,
    Chain.Arbitrum,
    Chain.Optimism,
  ],
  [WalletOption.OKX]: [
    Chain.Ethereum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Cosmos,
    Chain.Polygon,
    Chain.Arbitrum,
    Chain.Optimism,
  ],
  [WalletOption.TALISMAN]: [
    Chain.Ethereum,
    Chain.Base,
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Polygon,
    Chain.BinanceSmartChain,
    Chain.Optimism,
    Chain.Polkadot,
    Chain.Chainflip,
  ],
  [WalletOption.EXODUS]: [Chain.Ethereum, Chain.BinanceSmartChain, Chain.Polygon, Chain.Bitcoin],
  [WalletOption.LEDGER_LIVE]: [],
  [WalletOption.COSMOSTATION]: [],
  [WalletOption.VULTISIG]: [],
  [WalletOption.RADIX_WALLET]: [Chain.Radix],
  [WalletOption.TRONLINK]: [Chain.Tron],
  [WalletOption.XAMAN]: [Chain.Ripple],
  [WalletOption.WALLET_SELECTOR]: [],
};

const FEATURED_WALLETS = [
  WalletOption.METAMASK,
  WalletOption.CTRL,
  WalletOption.COINBASE_WEB,
  WalletOption.KEYSTORE,
  WalletOption.LEDGER,
  WalletOption.TREZOR,
  WalletOption.BRAVE,
  WalletOption.OKX,
];

export function WalletConnectDialog() {
  const modal = useModal();
  const [isShowingAllWallets, setIsShowingAllWallets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWalletGroups = useMemo(() => {
    return Object.entries(WALLET_GROUPS)
      ?.map(([groupTitle, wallets]) => {
        const matchingWallets = wallets?.filter((wallet) => wallet.toLowerCase().includes(searchQuery.toLowerCase()));

        if (matchingWallets?.length === 0) return null;

        return { groupTitle, wallets: matchingWallets };
      })
      ?.filter((group) => group !== null);
  }, [searchQuery]);

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect wallet</DialogTitle>
        </DialogHeader>

        <div className="sk-ui-relative">
          <Input
            className="sk-ui-h-10 sk-ui-bg-secondary sk-ui-pl-9 placeholer:sk-ui-text-muted-foreground sk-ui-text-base sk-ui-text-foreground"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wallet provider"
            value={searchQuery}
          />

          <SearchIcon className="sk-ui--translate-y-1/2 sk-ui-absolute sk-ui-top-1/2 sk-ui-left-3 sk-ui-size-4 sk-ui-text-muted-foreground" />
        </div>

        <div className="sk-ui--mx-6 sk-ui--mb-4 sk-ui-flex sk-ui-max-h-[60svh] sk-ui-flex-1 sk-ui-flex-col sk-ui-gap-4 sk-ui-overflow-auto sk-ui-px-6 sk-ui-pb-6">
          {match({ isShowingAllWallets, searchQuery })
            .with({ isShowingAllWallets: true }, { searchQuery: P.string.minLength(2) }, () =>
              filteredWalletGroups?.map(({ groupTitle, wallets }) => {
                return (
                  <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-2" key={`wallet-group-${groupTitle}`}>
                    <header className="sk-ui-text-muted-foreground sk-ui-text-sm">{groupTitle}</header>

                    <div className="sk-ui-grid sk-ui-grid-cols-4 sk-ui-gap-2">
                      {wallets?.map((wallet) => (
                        <WalletConnectButton key={`wallet-button-${wallet}`} wallet={wallet} />
                      ))}
                    </div>
                  </div>
                );
              }),
            )
            .otherwise(() => (
              <div className="sk-ui-grid sk-ui-grid-cols-4 sk-ui-gap-2">
                {FEATURED_WALLETS?.map((wallet) => (
                  <WalletConnectButton key={`wallet-button-${wallet}`} wallet={wallet} />
                ))}
              </div>
            ))}
        </div>

        <DialogFooter className="sk-ui-items-center sk-ui-justify-center sm:sk-ui-flex-col">
          <Button
            className="sk-ui--mt-1 sk-ui-w-auto sk-ui-text-foreground"
            onClick={() => {
              setIsShowingAllWallets((isShowingAllWallets) => !isShowingAllWallets);
            }}
            size="sm"
            variant="ghost">
            <WalletMinimalIcon className="sk-ui-size-4" />

            <span>{isShowingAllWallets ? "Hide all wallets" : "Show all wallets"}</span>
          </Button>

          <p className="sk-ui-max-w-sm sk-ui-text-center sk-ui-text-muted-foreground sk-ui-text-sm">
            By connecting your wallet, you agree to our{" "}
            <a className="sk-ui-text-foreground sk-ui-underline" href="/terms">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className="sk-ui-text-foreground sk-ui-underline" href="/privacy">
              Privacy Policy
            </a>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WalletConnectButton({ wallet }: { wallet: WalletOption }) {
  const { connectWallet, isConnectingWallet, walletType } = useSwapKit();
  const modal = useModal();

  const handleWalletClick = useCallback(async () => {
    try {
      const chainsForWallet = availableChainsByWallet?.[wallet] as Chain[];

      if (!chainsForWallet || chainsForWallet?.length === 0) {
        toast.error("This wallet does not support any chains", {
          description: "Please try a different wallet.",
          toasterId: SWAPKIT_WIDGET_TOASTER_ID,
        });
        return;
      }

      await match(wallet)
        .with(WalletOption.KEYSTORE, async () => {
          const { confirmed } = await showModal(<WalletKeystoreConnectDialog />);

          if (!confirmed) return;

          modal.resolve({ confirmed: true, data: wallet });
        })
        .otherwise(async () => {
          await connectWallet(wallet, chainsForWallet);

          modal.resolve({ confirmed: true, data: wallet });
        });
    } catch {
      toast.error("Failed to connect your wallet", {
        description: "Make sure your wallet is connected and accessible by the browser.",
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
    }
  }, [connectWallet, modal, wallet]);

  const walletName = wallet
    ?.split("")
    ?.map((letter, index) => (index === 0 ? letter.toUpperCase() : letter.toLowerCase()))
    ?.join("");

  return (
    <Button
      className="sk-ui-flex sk-ui-h-full sk-ui-w-full sk-ui-flex-col sk-ui-items-center sk-ui-justify-center sk-ui-gap-1 sk-ui-aspect-[1.525/1]"
      isLoading={isConnectingWallet && walletType === wallet}
      key={`wallet-connect-button-${wallet}`}
      onClick={handleWalletClick}>
      <WalletIcon className="sk-ui-size-5" wallet={wallet} />

      <span className="sk-ui-text-foreground sk-ui-text-sm">{walletName}</span>
    </Button>
  );
}
