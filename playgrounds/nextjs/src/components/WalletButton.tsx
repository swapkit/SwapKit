"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useSwapKit } from "~/lib/swapKit";
import { WalletConnectDialog } from "./WalletConnectDialog";
import { WalletDrawer } from "./WalletDrawer";

export function WalletButton() {
  const { isWalletConnected } = useSwapKit();
  const [connectOpen, setConnectOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {isWalletConnected ? (
        <Button onClick={() => setDrawerOpen(true)}>My Wallet</Button>
      ) : (
        <Button onClick={() => setConnectOpen(true)}>Connect Wallet</Button>
      )}

      <WalletConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
      <WalletDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
