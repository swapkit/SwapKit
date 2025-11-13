"use client";
import { ChainIcon, useModal, useSwapKit } from "@swapkit/ui/react";
import { LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { TokenBalance } from "./TokenBalance";
import { TruncatedAddress } from "./TruncatedAddress";

export function WalletDrawer() {
  const modal = useModal();
  const { walletType, disconnectWallet, balances } = useSwapKit();

  return (
    <Sheet {...modal}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Connected Wallets</SheetTitle>
          <SheetDescription>
            {walletType} connected to {balances.length} chain
            {balances.length !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-16">
          {balances?.map(({ balance, identifier }) => {
            return (
              <div className="space-y-4" key={`wallet-${identifier}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChainIcon chain={balance.chain} className="h-6 w-6" />

                    <h3 className="font-semibold">{balance.chain}</h3>
                  </div>

                  {balance?.address && <TruncatedAddress address={balance.address} />}
                </div>

                <div className="space-y-2">
                  {balance?.getValue?.("number") > 0 ? (
                    <TokenBalance balance={balance} />
                  ) : (
                    <div className="text-muted-foreground text-sm">No balance found</div>
                  )}
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
              modal.resolve({ confirmed: true, data: undefined });
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
