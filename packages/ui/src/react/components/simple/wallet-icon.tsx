"use client";

import type { WalletOption } from "@swapkit/helpers";
import { cn } from "../../../lib/utils";
import { getWalletLogoUrl } from "../config";

export function WalletIcon({ wallet, className = "" }: { wallet: WalletOption; className?: string }) {
  return (
    <img
      alt={wallet}
      className={cn("sk-ui-inline-block sk-ui-size-5 sk-ui-object-contain", className)}
      src={getWalletLogoUrl(wallet)}
    />
  );
}
