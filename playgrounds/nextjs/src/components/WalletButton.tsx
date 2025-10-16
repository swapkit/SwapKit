"use client";

import { useSwapKit } from "@swapkit/ui/react";
import { Button } from "~/components/ui/button";
import { showModal } from "~/hooks/use-modal";
import { WalletConnectDialog } from "./WalletConnectDialog";
import { WalletDrawer } from "./WalletDrawer";

export function WalletButton({ className }: { className?: string }) {
  const { isWalletConnected } = useSwapKit();

  return (
    <>
      {isWalletConnected ? (
        <Button className={className} onClick={() => showModal(<WalletDrawer />)} variant="primary">
          My Wallet
        </Button>
      ) : (
        <Button
          className={className}
          onClick={async () => {
            const { confirmed } = await showModal(<WalletConnectDialog />);

            if (!confirmed) return;

            void showModal(<WalletDrawer />);
          }}
          variant="primary">
          Connect Wallet
        </Button>
      )}
    </>
  );
}
