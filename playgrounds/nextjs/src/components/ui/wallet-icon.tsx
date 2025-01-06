"use client";

import { WalletOption } from "@swapkit/helpers";
import {
  Coins,
  Globe2,
  HardDrive,
  Laptop,
  type LucideIcon,
  Smartphone,
  Wallet,
} from "lucide-react";

const WALLET_ICONS: Record<WalletOption, LucideIcon> = {
  [WalletOption.LEDGER]: HardDrive,
  [WalletOption.LEDGER_LIVE]: HardDrive,
  [WalletOption.TREZOR]: HardDrive,
  [WalletOption.KEEPKEY]: HardDrive,
  [WalletOption.KEEPKEY_BEX]: HardDrive,
  [WalletOption.METAMASK]: Laptop,
  [WalletOption.PHANTOM]: Laptop,
  [WalletOption.KEPLR]: Globe2,
  [WalletOption.EXODUS]: Wallet,
  [WalletOption.BRAVE]: Laptop,
  [WalletOption.OKX]: Laptop,
  [WalletOption.LEAP]: Globe2,
  [WalletOption.POLKADOT_JS]: Laptop,
  [WalletOption.TALISMAN]: Laptop,
  [WalletOption.EIP6963]: Laptop,
  [WalletOption.WALLETCONNECT]: Smartphone,
  [WalletOption.COINBASE_WEB]: Laptop,
  [WalletOption.COINBASE_MOBILE]: Smartphone,
  [WalletOption.TRUSTWALLET_WEB]: Laptop,
  [WalletOption.OKX_MOBILE]: Smartphone,
  [WalletOption.BITGET]: Laptop,
  [WalletOption.KEYSTORE]: Coins,
  [WalletOption.CTRL]: Wallet,
  [WalletOption.RADIX_WALLET]: Wallet,
};

export function WalletIcon({
  wallet,
  className = "",
}: { wallet: WalletOption; className?: string }) {
  const Icon = WALLET_ICONS[wallet];
  if (!Icon) return null;

  return <Icon className={`inline-block h-4 w-4 ${className}`} />;
}
