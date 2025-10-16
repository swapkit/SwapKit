import { WalletOption } from "@swapkit/helpers";
import type { SKWallets } from "./types";

export async function loadWallet<W extends WalletOption>(walletOption: W): Promise<SKWallets[W]> {
  const { match } = await import("ts-pattern");

  const wallet = await match(walletOption as WalletOption)
    .with(WalletOption.COINBASE_MOBILE, async () => (await import("./coinbase")).coinbaseWallet)
    .with(WalletOption.BITGET, async () => (await import("@swapkit/wallet-extensions/bitget")).bitgetWallet)
    .with(WalletOption.CTRL, async () => (await import("@swapkit/wallet-extensions/ctrl")).ctrlWallet)
    .with(WalletOption.VULTISIG, async () => (await import("@swapkit/wallet-extensions/vultisig")).vultisigWallet)
    .with(WalletOption.OKX, async () => (await import("@swapkit/wallet-extensions/okx")).okxWallet)
    .with(WalletOption.ONEKEY, async () => (await import("@swapkit/wallet-extensions/onekey")).onekeyWallet)
    .with(WalletOption.EXODUS, async () => (await import("./exodus")).exodusWallet)
    .with(WalletOption.KEEPKEY, async () => (await import("@swapkit/wallet-hardware/keepkey")).keepkeyWallet)
    .with(
      WalletOption.KEEPKEY_BEX,
      async () => (await import("@swapkit/wallet-extensions/keepkey-bex")).keepkeyBexWallet,
    )
    .with(WalletOption.WALLETCONNECT, async () => (await import("./walletconnect")).walletconnectWallet)
    .with(
      WalletOption.KEPLR,
      WalletOption.LEAP,
      async () => (await import("@swapkit/wallet-extensions/keplr")).keplrWallet,
    )
    .with(
      WalletOption.COSMOSTATION,
      async () => (await import("@swapkit/wallet-extensions/cosmostation")).cosmostationWallet,
    )
    .with(
      WalletOption.BRAVE,
      WalletOption.COINBASE_WEB,
      WalletOption.EIP6963,
      WalletOption.METAMASK,
      WalletOption.OKX_MOBILE,
      WalletOption.TRUSTWALLET_WEB,
      async () => (await import("@swapkit/wallet-extensions/evm-extensions")).evmWallet,
    )

    .with(WalletOption.KEYSTORE, async () => (await import("@swapkit/wallet-keystore")).keystoreWallet)
    .with(WalletOption.TREZOR, async () => (await import("@swapkit/wallet-hardware/trezor")).trezorWallet)
    .with(
      WalletOption.LEDGER,
      // TODO: Remove
      WalletOption.LEDGER_LIVE,
      async () => (await import("@swapkit/wallet-hardware/ledger")).ledgerWallet,
    )

    .with(WalletOption.PHANTOM, async () => (await import("@swapkit/wallet-extensions/phantom")).phantomWallet)
    .with(WalletOption.POLKADOT_JS, async () => (await import("@swapkit/wallet-extensions/polkadotjs")).polkadotWallet)
    .with(WalletOption.RADIX_WALLET, async () => (await import("./radix")).radixWallet)
    .with(WalletOption.TALISMAN, async () => (await import("@swapkit/wallet-extensions/talisman")).talismanWallet)
    .with(WalletOption.TRONLINK, async () => (await import("@swapkit/wallet-extensions/tronlink")).tronlinkWallet)
    .with(WalletOption.WALLET_SELECTOR, async () => (await import("./near-wallet-selector")).walletSelectorWallet)
    .with(WalletOption.XAMAN, async () => (await import("./xaman")).xamanWallet)
    .exhaustive();

  return wallet as SKWallets[W];
}
