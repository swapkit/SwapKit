import { WalletOption } from "@swapkit/helpers";
import { bitgetWallet } from "./bitget";
import { coinbaseWallet } from "./coinbase";
import { ctrlWallet } from "./ctrl";
import { evmWallet } from "./evm-extensions";
import { exodusWallet } from "./exodus";
import { keepkeyWallet } from "./keepkey";
import { keepkeyBexWallet } from "./keepkey-bex";
import { keplrWallet } from "./keplr";
import { keystoreWallet } from "./keystore";
import { ledgerWallet } from "./ledger";
import { okxWallet } from "./okx";
import { onekeyWallet } from "./onekey";
import { phantomWallet } from "./phantom";
import { polkadotWallet } from "./polkadotjs";
import { radixWallet } from "./radix";
import { talismanWallet } from "./talisman";
import { trezorWallet } from "./trezor";
import { walletconnectWallet } from "./walletconnect";

export const wallets = {
  ...bitgetWallet,
  ...coinbaseWallet,
  ...ctrlWallet,
  ...evmWallet,
  ...exodusWallet,
  ...keepkeyWallet,
  ...keepkeyBexWallet,
  ...keplrWallet,
  ...keystoreWallet,
  ...ledgerWallet,
  ...okxWallet,
  ...onekeyWallet,
  ...phantomWallet,
  ...polkadotWallet,
  ...radixWallet,
  ...talismanWallet,
  ...trezorWallet,
  ...walletconnectWallet,
};

export type SKWallets = {
  [WalletOption.BITGET]: typeof bitgetWallet;
  [WalletOption.BRAVE]: typeof evmWallet;
  [WalletOption.COINBASE_MOBILE]: typeof coinbaseWallet;
  [WalletOption.COINBASE_WEB]: typeof evmWallet;
  [WalletOption.CTRL]: typeof ctrlWallet;
  [WalletOption.EIP6963]: typeof evmWallet;
  [WalletOption.EXODUS]: typeof exodusWallet;
  [WalletOption.KEEPKEY]: typeof keepkeyWallet;
  [WalletOption.KEEPKEY_BEX]: typeof keepkeyBexWallet;
  [WalletOption.KEPLR]: typeof keplrWallet;
  [WalletOption.KEYSTORE]: typeof keystoreWallet;
  [WalletOption.LEAP]: typeof keplrWallet;
  [WalletOption.LEDGER]: typeof ledgerWallet;
  [WalletOption.LEDGER_LIVE]: typeof ledgerWallet;
  [WalletOption.METAMASK]: typeof evmWallet;
  [WalletOption.OKX]: typeof okxWallet;
  [WalletOption.OKX_MOBILE]: typeof evmWallet;
  [WalletOption.ONEKEY]: typeof onekeyWallet;
  [WalletOption.PHANTOM]: typeof phantomWallet;
  [WalletOption.POLKADOT_JS]: typeof polkadotWallet;
  [WalletOption.RADIX_WALLET]: typeof radixWallet;
  [WalletOption.TALISMAN]: typeof talismanWallet;
  [WalletOption.TREZOR]: typeof trezorWallet;
  [WalletOption.TRUSTWALLET_WEB]: typeof evmWallet;
  [WalletOption.WALLETCONNECT]: typeof walletconnectWallet;
};

export type SKWalletsSupportedChains = {
  [WalletOption.BITGET]: typeof bitgetWallet.connectBitget.supportedChains;
  [WalletOption.BRAVE]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.COINBASE_MOBILE]: typeof coinbaseWallet.connectCoinbaseWallet.supportedChains;
  [WalletOption.COINBASE_WEB]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.CTRL]: typeof ctrlWallet.connectCtrl.supportedChains;
  [WalletOption.EIP6963]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.EXODUS]: typeof exodusWallet.connectExodusWallet.supportedChains;
  [WalletOption.KEEPKEY]: typeof keepkeyWallet.connectKeepkey.supportedChains;
  [WalletOption.KEEPKEY_BEX]: typeof keepkeyBexWallet.connectKeepkeyBex.supportedChains;
  [WalletOption.KEPLR]: typeof keplrWallet.connectKeplr.supportedChains;
  [WalletOption.KEYSTORE]: typeof keystoreWallet.connectKeystore.supportedChains;
  [WalletOption.LEAP]: typeof keplrWallet.connectKeplr.supportedChains;
  [WalletOption.LEDGER]: typeof ledgerWallet.connectLedger.supportedChains;
  [WalletOption.LEDGER_LIVE]: typeof ledgerWallet.connectLedger.supportedChains;
  [WalletOption.METAMASK]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.OKX]: typeof okxWallet.connectOkx.supportedChains;
  [WalletOption.OKX_MOBILE]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.ONEKEY]: typeof onekeyWallet.connectOnekeyWallet.supportedChains;
  [WalletOption.PHANTOM]: typeof phantomWallet.connectPhantom.supportedChains;
  [WalletOption.POLKADOT_JS]: typeof polkadotWallet.connectPolkadotJs.supportedChains;
  [WalletOption.RADIX_WALLET]: typeof radixWallet.connectRadixWallet.supportedChains;
  [WalletOption.TALISMAN]: typeof talismanWallet.connectTalisman.supportedChains;
  [WalletOption.TREZOR]: typeof trezorWallet.connectTrezor.supportedChains;
  [WalletOption.TRUSTWALLET_WEB]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.WALLETCONNECT]: typeof walletconnectWallet.connectWalletconnect.supportedChains;
};
