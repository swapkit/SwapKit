"use client";
import { ChainIcon, useModal, useSwapKit } from "@swapkit/ui/react";
import { LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { showModal } from "./hooks/use-modal";
import { TokenBalance } from "./TokenBalance";
import { TruncatedAddress } from "./TruncatedAddress";

export function showSwapKitWalletDrawer() {
  return showModal(<SwapKitWalletDrawer />);
}

export function SwapKitWalletDrawer() {
  const modal = useModal();
  const { walletType, disconnectWallet, balancesByChain } = useSwapKit();

  return (
    <Sheet {...modal}>
      <SheetContent className="sk-ui-flex sk-ui-flex-col">
        <SheetHeader>
          <SheetTitle>Connected Wallet</SheetTitle>

          <SheetDescription>
            You are currently connected to {walletType} on {balancesByChain.size}{" "}
            {balancesByChain.size !== 1 ? "chains" : "chain"}
          </SheetDescription>
        </SheetHeader>

        <div className="sk-ui--mr-4 sk-ui-mt-4 sk-ui-flex sk-ui-w-auto sk-ui-flex-1 sk-ui-flex-col sk-ui-space-y-6 sk-ui-overflow-y-auto sk-ui-pt-2 sk-ui-pr-4 sk-ui-pb-16">
          {Array.from(balancesByChain?.entries() ?? []).map(([chain, balances]) => {
            const walletAddress = balances?.[0]?.wallet?.address;

            return (
              <div className="sk-ui-space-y-4" key={`wallet-chain-${chain}`}>
                <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
                  <ChainIcon chain={chain} className="sk-ui-size-6" />

                  <h3 className="sk-ui-font-semibold">{chain}</h3>

                  {walletAddress && <TruncatedAddress address={walletAddress} className="sk-ui-ml-auto" />}
                </div>

                <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-2">
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
          className="sk-ui-w-full"
          onClick={() => {
            disconnectWallet();
            modal.resolve({ confirmed: true, data: undefined });
          }}
          variant="destructive">
          <LogOut className="sk-ui-mr-2 sk-ui-size-4" />
          Disconnect
        </Button>
      </SheetContent>
    </Sheet>
  );
}
