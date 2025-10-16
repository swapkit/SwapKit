"use client";

import { Chain, EVMChains, WalletOption } from "@swapkit/helpers";
import { BITGET_SUPPORTED_CHAINS } from "@swapkit/wallets/bitget";
import { PHANTOM_SUPPORTED_CHAINS } from "@swapkit/wallets/phantom";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useModal } from "../../hooks/use-modal";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { WalletIcon } from "../wallet-icon";

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

export function WalletConnectDialog() {
  const modal = useModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [_selectedChains, _setSelectedChainss] = useState<Chain[]>([]);
  // const { connectWallet, isConnectingWallet } = useSwapKit();

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect wallet</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            className="h-10 bg-secondary pl-9 placeholer:text-muted-foreground text-base text-foreground"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wallet provider"
            value={searchQuery}
          />

          <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        </div>

        <div className="-mx-6 -mb-6 flex max-h-[60svh] flex-1 flex-col gap-4 overflow-auto px-6 pb-6">
          {Object.entries(WALLET_GROUPS).map(([groupTitle, wallets]) => {
            return (
              <div className="flex flex-col gap-2" key={`wallet-group-${groupTitle}`}>
                <header className="text-muted-foreground text-sm">{groupTitle}</header>

                <div className="grid grid-cols-4 gap-2">
                  {wallets?.map((wallet) => (
                    <Button
                      className="flex aspect-[1.525/1] h-full w-full flex-col items-center justify-center gap-1"
                      key={`wallet-button-${wallet}`}>
                      <WalletIcon className="size-5" wallet={wallet} />

                      <span className="text-foreground text-sm">
                        {wallet
                          ?.split("")
                          .map((letter, index) => (index === 0 ? letter.toUpperCase() : letter.toLowerCase()))
                          .join("")}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
