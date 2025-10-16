"use client";
import type { Chain } from "@swapkit/helpers";
import { ChainIcon, useModal, useSwapKit } from "@swapkit/ui/react";
import { LogOut } from "lucide-react";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { TokenBalance } from "./TokenBalance";
import { TruncatedAddress } from "./TruncatedAddress";

export function WalletDrawer() {
  const modal = useModal();
  const { balances, walletType, disconnectWallet } = useSwapKit();

  const connectedChains = useMemo(() => {
    const uniqueChains = new Set<Chain>();
    for (const balance of balances) {
      uniqueChains.add(balance.chain);
    }
    return Array.from(uniqueChains);
  }, [balances]);

  const chainAddresses = useMemo(() => {
    const addresses = new Map<Chain, string>();
    for (const balance of balances) {
      if (!addresses.has(balance.chain)) {
        addresses.set(balance.chain, balance.address || "");
      }
    }
    return addresses;
  }, [balances]);

  return (
    <Sheet {...modal}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Connected Wallets</SheetTitle>
          <SheetDescription>
            {walletType} connected to {connectedChains.length} chain
            {connectedChains.length !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-16">
          {connectedChains?.map((chain) => {
            const chainBalances = balances.filter((b) => b.chain === chain);
            const address = chainAddresses.get(chain);
            const gasAsset = chainBalances.find((b) => b.isGasAsset);
            const otherBalances = chainBalances.filter((b) => !b.isGasAsset);

            return (
              <div className="space-y-4" key={chain}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChainIcon chain={chain} className="h-6 w-6" />
                    <h3 className="font-semibold">{chain}</h3>
                  </div>
                  {address && <TruncatedAddress address={address} />}
                </div>
                <div className="space-y-2">
                  {gasAsset && (
                    <div className="mb-2">
                      <TokenBalance balance={gasAsset} />
                    </div>
                  )}
                  {otherBalances.map((balance) => (
                    <TokenBalance balance={balance} key={`${balance.chain}-${balance.ticker || balance.symbol}`} />
                  ))}
                  {chainBalances.length === 0 && <div className="text-muted-foreground text-sm">No balances found</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute right-6 bottom-6 left-6">
          <Button
            className="w-full"
            onClick={() => {
              disconnectWallet();
              modal.resolve({ confirmed: true });
            }}
            variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
