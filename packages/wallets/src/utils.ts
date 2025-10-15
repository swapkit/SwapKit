import { WalletOption } from "@swapkit/helpers";
import type { SKWallets } from "./types";

export async function loadWallet<W extends WalletOption>(walletOption: W): Promise<SKWallets[W]> {
  const { match } = await import("ts-pattern");

  const wallet = await match(walletOption as WalletOption)
    .with(WalletOption.COINBASE_MOBILE, async () => (await import("./coinbase")).coinbaseWallet)
    .with(WalletOption.BITGET, async () => (await import("./bitget")).bitgetWallet)
    .with(WalletOption.CTRL, async () => (await import("./ctrl")).ctrlWallet)
    .with(WalletOption.VULTISIG, async () => (await import("./vultisig")).vultisigWallet)
    .with(WalletOption.OKX, async () => (await import("./okx")).okxWallet)
    .with(WalletOption.ONEKEY, async () => (await import("./onekey")).onekeyWallet)
    .with(WalletOption.EXODUS, async () => (await import("./exodus")).exodusWallet)
    .with(WalletOption.KEEPKEY, async () => (await import("@swapkit/wallet-hardware/keepkey")).keepkeyWallet)
    .with(WalletOption.KEEPKEY_BEX, async () => (await import("./keepkey-bex")).keepkeyBexWallet)
    .with(WalletOption.WALLETCONNECT, async () => (await import("./walletconnect")).walletconnectWallet)
    .with(WalletOption.KEPLR, WalletOption.LEAP, async () => (await import("./keplr")).keplrWallet)
    .with(WalletOption.COSMOSTATION, async () => (await import("./cosmostation")).cosmostationWallet)
    .with(
      WalletOption.BRAVE,
      WalletOption.COINBASE_WEB,
      WalletOption.EIP6963,
      WalletOption.METAMASK,
      WalletOption.OKX_MOBILE,
      WalletOption.TRUSTWALLET_WEB,
      async () => (await import("./evm-extensions")).evmWallet,
    )

    .with(WalletOption.KEYSTORE, async () => (await import("./keystore")).keystoreWallet)
    .with(WalletOption.TREZOR, async () => (await import("@swapkit/wallet-hardware/trezor")).trezorWallet)
    .with(
      WalletOption.LEDGER,
      // TODO: Remove
      WalletOption.LEDGER_LIVE,
      async () => (await import("@swapkit/wallet-hardware/ledger")).ledgerWallet,
    )

    .with(WalletOption.PHANTOM, async () => (await import("./phantom")).phantomWallet)
    .with(WalletOption.POLKADOT_JS, async () => (await import("./polkadotjs")).polkadotWallet)
    .with(WalletOption.RADIX_WALLET, async () => (await import("./radix")).radixWallet)
    .with(WalletOption.TALISMAN, async () => (await import("./talisman")).talismanWallet)
    .with(WalletOption.TRONLINK, async () => (await import("./tronlink")).tronlinkWallet)
    .with(WalletOption.WALLET_SELECTOR, async () => (await import("./near-wallet-selector")).walletSelectorWallet)
    .with(WalletOption.XAMAN, async () => (await import("./xaman")).xamanWallet)
    .exhaustive();

  return wallet as SKWallets[W];
}
