"use client";

import type { WalletOption } from "@swapkit/helpers";
import { cn } from "../../lib/utils";
import { temp_host } from "./asset-icon";

export function WalletIcon({ wallet, className = "" }: { wallet: WalletOption; className?: string }) {
  return (
    <img
      alt={wallet}
      className={cn("sk-ui-inline-block sk-ui-size-5 sk-ui-object-contain", className)}
      src={`${temp_host}/images/wallets/${wallet.toLowerCase()}.png`}
    />
  );
}
