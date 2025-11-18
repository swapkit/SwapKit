"use client";
import { ChainIcon, useModal, useSwapKit } from "@swapkit/ui/react";
import { LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { TokenBalance } from "./TokenBalance";
import { TruncatedAddress } from "./TruncatedAddress";
import { Separator } from "./ui/separator";

export function WalletDrawer() {
  const modal = useModal();
  const { walletType, disconnectWallet, balancesByChain } = useSwapKit();

  return (
    <Sheet {...modal}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Connected Wallets</SheetTitle>
          <SheetDescription>
            {walletType} connected to {balancesByChain.size} chain
            {balancesByChain.size !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="-mr-4 mt-6 flex w-auto flex-1 flex-col space-y-6 overflow-y-auto pr-4 pb-16">
          {Array.from(balancesByChain?.entries() ?? []).map(([chain, balances]) => {
            const walletAddress = balances?.[0]?.wallet?.address;

            return (
              <div className="space-y-4" key={`wallet-chain-${chain}`}>
                <div className="flex items-center gap-2">
                  <ChainIcon chain={chain} className="h-6 w-6" />

                  <h3 className="font-semibold">{chain}</h3>

                  {walletAddress && <TruncatedAddress address={walletAddress} className="ml-auto" />}
                </div>

                <div className="flex flex-col gap-2">
                  {balances?.map(({ balance, identifier }) => (
                    <TokenBalance balance={balance} key={`wallet-chain-balance-${identifier}`} />
                  ))}
                </div>

                <Separator />
              </div>
            );
          })}
        </div>

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
      </SheetContent>
    </Sheet>
  );
}
