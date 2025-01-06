"use client";

import { Chain } from "@swapkit/helpers";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { WalletConnect } from "~/components/WalletConnect";
import { Button } from "~/components/ui/button";
import { ChainIcon } from "~/components/ui/chain-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { useSwapKit } from "~/lib/swapKit";

const CHAIN_GROUPS = {
  "EVM Chains": [
    Chain.Ethereum,
    Chain.BinanceSmartChain,
    Chain.Avalanche,
    Chain.Polygon,
    Chain.Arbitrum,
    Chain.Optimism,
    Chain.Base,
  ],
  "UTXO Chains": [Chain.Bitcoin, Chain.BitcoinCash, Chain.Litecoin, Chain.Dogecoin, Chain.Dash],
  "Cosmos Chains": [Chain.Cosmos, Chain.THORChain, Chain.Maya, Chain.Kujira],
  "Other Chains": [Chain.Solana, Chain.Polkadot, Chain.Radix, Chain.Chainflip],
};

export function NavigationBar() {
  const { disconnectWallet, isWalletConnected, walletType } = useSwapKit();
  const [selectedChains, setSelectedChains] = useState<Chain[]>([]);

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="text-lg font-semibold">SwapKit Playground</div>
        <div className="ml-auto flex items-center space-x-4">
          {isWalletConnected ? (
            <Button onClick={() => disconnectWallet()} variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Disconnect {walletType}
            </Button>
          ) : (
            <DropdownMenu
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedChains([]);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isWalletConnected}>
                  <Wallet className="mr-2 h-4 w-4" />
                  {isWalletConnected ? "Connecting..." : "Connect Wallet"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[600px]">
                <div className="grid grid-cols-2 divide-x">
                  <div className="pr-2">
                    <DropdownMenuLabel className="font-bold text-center">
                      Select Chains
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-[400px] overflow-y-auto">
                      {Object.entries(CHAIN_GROUPS).map(([groupName, chains]) => (
                        <div key={groupName} className="px-2 py-1.5">
                          <DropdownMenuLabel className="font-bold text-sm">
                            {groupName}
                          </DropdownMenuLabel>
                          <div className="grid grid-cols-1 gap-1">
                            {chains.map((chain) => {
                              const isSelected = selectedChains.includes(chain);
                              return (
                                <Button
                                  key={chain}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="justify-start"
                                  onClick={() => {
                                    setSelectedChains((prev) =>
                                      isSelected
                                        ? prev.filter((c) => c !== chain)
                                        : [...prev, chain],
                                    );
                                  }}
                                >
                                  <ChainIcon chain={chain} className="mr-2" />
                                  <span className="truncate">{chain}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pl-2">
                    <DropdownMenuLabel className="font-bold text-center">
                      Select Wallet
                      {selectedChains.length > 0 && (
                        <div className="font-normal text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                          {selectedChains.map((chain) => (
                            <span key={chain} className="inline-flex items-center">
                              <ChainIcon chain={chain} className="mr-1" />
                              {chain}
                            </span>
                          ))}
                        </div>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <WalletConnect
                      chains={selectedChains}
                      onSuccess={() => setSelectedChains([])}
                      onError={(error) => {
                        console.error(error);
                        setSelectedChains([]);
                      }}
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
