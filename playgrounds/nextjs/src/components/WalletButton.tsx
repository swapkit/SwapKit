"use client";

import { useSwapKit } from "@swapkit/ui/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { WalletConnectDialog } from "./WalletConnectDialog";
import { WalletDrawer } from "./WalletDrawer";

export function WalletButton() {
  const { isWalletConnected } = useSwapKit();
  const [connectOpen, setConnectOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {isWalletConnected ? (
        <Button onClick={() => setDrawerOpen(true)} variant="primary">
          My Wallet
        </Button>
      ) : (
        <Button onClick={() => setConnectOpen(true)} variant="primary">
          Connect Wallet
        </Button>
      )}

      <WalletConnectDialog onOpenChange={setConnectOpen} open={connectOpen} />
      <WalletDrawer onOpenChange={setDrawerOpen} open={drawerOpen} />
    </>
  );
}
