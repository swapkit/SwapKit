import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { Chain, EVMChains, getDerivationPathFor, getEIP6963Wallets, SKConfig, WalletOption } from "@swapkit/core";
import type { DerivationPathArray, FullWallet } from "@swapkit/sdk";
import { LEDGER_SUPPORTED_CHAINS } from "@swapkit/wallets/ledger";
import { BITGET_SUPPORTED_CHAINS } from "@swapkit/wallets/bitget";
import { CTRL_SUPPORTED_CHAINS } from "@swapkit/wallets/ctrl";
import { KEEPKEY_SUPPORTED_CHAINS } from "@swapkit/wallets/keepkey";
import { KEEPKEY_BEX_SUPPORTED_CHAINS } from "@swapkit/wallets/keepkey-bex";
import { KEPLR_SUPPORTED_CHAINS } from "@swapkit/wallets/keplr";
import { decryptFromKeystore, KEYSTORE_SUPPORTED_CHAINS } from "@swapkit/wallets/keystore";
import { OKX_SUPPORTED_CHAINS } from "@swapkit/wallets/okx";
import { ONEKEY_WALLET_SUPPORTED_CHAINS } from "@swapkit/wallets/onekey";
import { PASSKEYS_SUPPORTED_CHAINS } from "@swapkit/wallets/passkeys";
import { PHANTOM_SUPPORTED_CHAINS } from "@swapkit/wallets/phantom";
import { POLKADOT_SUPPORTED_CHAINS } from "@swapkit/wallets/polkadotjs";
import { RADIX_SUPPORTED_CHAINS } from "@swapkit/wallets/radix";
import { TALISMAN_SUPPORTED_CHAINS } from "@swapkit/wallets/talisman";
import { TREZOR_SUPPORTED_CHAINS } from "@swapkit/wallets/trezor";
import { TRONLINK_SUPPORTED_CHAINS } from "@swapkit/wallets/tronlink";
import { VULTISIG_SUPPORTED_CHAINS } from "@swapkit/wallets/vultisig";
import { WC_SUPPORTED_CHAINS } from "@swapkit/wallets/walletconnect";
import { XAMAN_SUPPORTED_CHAINS } from "@swapkit/wallets/xaman";
import type { Eip1193Provider } from "ethers";
import { useCallback, useState } from "react";
import { ChainSelector } from "./components/ChainSelector";
import { KeystoreUpload } from "./components/KeystoreUpload";
import { WalletButton } from "./components/WalletButton";
import type { SwapKitClient } from "./swapKitClient";

type Props = {
  setPhrase: (phrase: string) => void;
  setWallet: (wallet: FullWallet[Chain] | FullWallet[Chain][]) => void;
  skClient?: SwapKitClient;
};

const walletOptions = Object.values(WalletOption).filter((o) => ![WalletOption.EXODUS].includes(o));

export const availableChainsByWallet = {
  [WalletOption.BITGET]: BITGET_SUPPORTED_CHAINS,
  [WalletOption.BRAVE]: EVMChains,
  [WalletOption.COINBASE_MOBILE]: EVMChains,
  [WalletOption.COINBASE_WEB]: EVMChains,
  [WalletOption.COSMOSTATION]: [],
  [WalletOption.CTRL]: CTRL_SUPPORTED_CHAINS,
  [WalletOption.EIP6963]: EVMChains,
  [WalletOption.EXODUS]: PASSKEYS_SUPPORTED_CHAINS,
  [WalletOption.KEEPKEY]: KEEPKEY_SUPPORTED_CHAINS,
  [WalletOption.KEEPKEY_BEX]: KEEPKEY_BEX_SUPPORTED_CHAINS,
  [WalletOption.KEPLR]: KEPLR_SUPPORTED_CHAINS,
  [WalletOption.KEYSTORE]: KEYSTORE_SUPPORTED_CHAINS,
  [WalletOption.LEAP]: KEPLR_SUPPORTED_CHAINS,
  [WalletOption.LEDGER]: LEDGER_SUPPORTED_CHAINS,
  [WalletOption.METAMASK]: EVMChains,
  [WalletOption.OKX]: OKX_SUPPORTED_CHAINS,
  [WalletOption.OKX_MOBILE]: EVMChains,
  [WalletOption.ONEKEY]: ONEKEY_WALLET_SUPPORTED_CHAINS,
  [WalletOption.PASSKEYS]: PASSKEYS_SUPPORTED_CHAINS,
  [WalletOption.PHANTOM]: PHANTOM_SUPPORTED_CHAINS,
  [WalletOption.POLKADOT_JS]: POLKADOT_SUPPORTED_CHAINS,
  [WalletOption.RADIX_WALLET]: RADIX_SUPPORTED_CHAINS,
  [WalletOption.TALISMAN]: TALISMAN_SUPPORTED_CHAINS,
  [WalletOption.TREZOR]: TREZOR_SUPPORTED_CHAINS,
  [WalletOption.TRONLINK]: TRONLINK_SUPPORTED_CHAINS,
  [WalletOption.TRUSTWALLET_WEB]: EVMChains,
  [WalletOption.VULTISIG]: VULTISIG_SUPPORTED_CHAINS,
  [WalletOption.WALLETCONNECT]: WC_SUPPORTED_CHAINS,
  [WalletOption.WALLET_SELECTOR]: [Chain.Near],
  [WalletOption.XAMAN]: XAMAN_SUPPORTED_CHAINS,
};

export const WalletPicker = ({ skClient, setWallet, setPhrase }: Props) => {
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<Chain[]>([]);

  const connectWallet = useCallback(
    async (option: WalletOption, provider?: Eip1193Provider) => {
      const chainsToConnect = chains.length > 0 ? chains : availableChainsByWallet[option as keyof typeof availableChainsByWallet] || [];
      if (!chainsToConnect.length) return alert("no chains to connect");
      if (!skClient) return alert("client is not ready");

      switch (option) {
        case WalletOption.BITGET:
          return skClient.connectBitget?.(chainsToConnect);
        case WalletOption.COINBASE_WEB:
        case WalletOption.METAMASK:
        case WalletOption.TRUSTWALLET_WEB:
        case WalletOption.EIP6963:
          return skClient.connectEVMWallet(chainsToConnect, option, provider);
        case WalletOption.TALISMAN:
          return skClient.connectTalisman(chainsToConnect);
        case WalletOption.KEPLR:
        case WalletOption.LEAP:
          return skClient.connectKeplr(chainsToConnect, option);
        case WalletOption.KEEPKEY: {
          const derivationPaths = chainsToConnect.reduce(
            (acc, chain) => {
              const derivPath = getDerivationPathFor({ chain, index: 0 });
              acc[chain] = derivPath as DerivationPathArray;
              return acc;
            },
            {} as Record<Chain, DerivationPathArray>,
          );

          await skClient.connectKeepkey?.(chainsToConnect, derivationPaths);
          const { keepKey } = SKConfig.get("apiKeys");
          if (keepKey) {
            localStorage.setItem("keepkeyApiKey", keepKey);
          }
          return true;
        }
        case WalletOption.KEEPKEY_BEX:
          return skClient.connectKeepkeyBex?.(chainsToConnect);
        case WalletOption.ONEKEY:
          return skClient.connectOnekeyWallet?.(chainsToConnect);
        case WalletOption.TREZOR:
        case WalletOption.LEDGER: {
          const [chain] = chainsToConnect;
          if (!chain) return alert("chain is required");

          const connectMethod = WalletOption.TREZOR === option ? skClient.connectTrezor : skClient.connectLedger;
          const derivPath = getDerivationPathFor({ chain, index: 0 }) as DerivationPathArray;

          return connectMethod?.(chains, derivPath);
        }

        case WalletOption.PASSKEYS: {
          return skClient.connectPasskeys?.(chainsToConnect);
        }
        case WalletOption.COINBASE_MOBILE:
          return skClient.connectCoinbaseWallet?.(chainsToConnect);
        case WalletOption.CTRL:
          return skClient.connectCtrl?.(chainsToConnect);
        case WalletOption.VULTISIG:
          return skClient.connectVultisig?.(chainsToConnect);
        case WalletOption.OKX:
          return skClient.connectOkx?.(chainsToConnect);
        case WalletOption.POLKADOT_JS:
          return skClient.connectPolkadotJs?.(chainsToConnect as Chain.Polkadot[]);

        // case WalletOption.RADIX_WALLET:
        //   return skClient.connectRadixWallet?.();

        case WalletOption.PHANTOM:
          return skClient.connectPhantom?.(chainsToConnect);
        case WalletOption.RADIX_WALLET:
          return skClient.connectRadixWallet?.([Chain.Radix]);
        case WalletOption.WALLETCONNECT:
          return skClient.connectWalletconnect?.(chainsToConnect);
        case WalletOption.TRONLINK:
          return skClient.connectTronLink?.(chainsToConnect);
        case WalletOption.XAMAN:
          return skClient.connectXaman?.(chainsToConnect);
        case WalletOption.WALLET_SELECTOR:
          return skClient.connectWalletSelector?.(chainsToConnect, [setupMeteorWallet()]);

        default:
          throw new Error(`Unsupported wallet option: ${option}`);
      }
    },
    [chains, skClient],
  );

  const handleBalanceUpdate = useCallback(async () => {
    if (!skClient) return alert("client is not ready");
    try {
      const walletChains = Object.keys(skClient.getAllWallets()) as Chain[];

      const walletDataArray = await Promise.all(
        walletChains.map((chain) => skClient.getWalletWithBalance(chain, true)),
      );
      setWallet(walletDataArray);
    } catch (e) {
      console.error(e);
      alert(e);
    }
  }, [skClient, setWallet]);

  const handleKeystoreConnection = useCallback(
    async ({ target }: any) => {
      if (!skClient) return alert("client is not ready");

      setLoading(true);

      const keystoreFile = await target.files[0].text();

      setTimeout(async () => {
        const password = prompt("Enter password");

        if (!password) {
          setLoading(false);
          target.value = "";
          return alert("password is required");
        }
        try {
          const phrases = await decryptFromKeystore(JSON.parse(keystoreFile), password);
          setPhrase(phrases);

          await skClient.connectKeystore(chains.length > 0 ? chains : KEYSTORE_SUPPORTED_CHAINS, phrases);
          const walletDataArray = Object.values(skClient.getAllWallets());
          // @ts-expect-error
          setWallet(walletDataArray);
          setChains([]);
          target.value = "";
          setLoading(false);
          handleBalanceUpdate();
        } catch (e) {
          console.error(e);
          alert(e);
          setLoading(false);
          target.value = "";
        }
      }, 500);
    },
    [setWallet, chains, skClient, setPhrase, handleBalanceUpdate],
  );

  const handleConnection = useCallback(
    async (option: WalletOption, provider?: Eip1193Provider) => {
      if (!skClient) return alert("client is not ready");
      setLoading(true);
      await connectWallet(option, provider);
      const walletDataArray = Object.values(skClient.getAllWallets());
      // @ts-expect-error
      setWallet(walletDataArray);
      setChains([]);
      setLoading(false);

      handleBalanceUpdate();
    },
    [connectWallet, setWallet, skClient, handleBalanceUpdate],
  );

  const isWalletDisabled = useCallback(
    (wallet: WalletOption) => {
      if (chains.length === 0) return false;
      const supported = availableChainsByWallet[wallet as keyof typeof availableChainsByWallet] || [];
      return !chains.every((chain) => supported.includes(chain as never));
    },
    [chains],
  );

  const handleWalletClick = useCallback(
    (option: WalletOption, provider?: Eip1193Provider) => {
      if (chains.length === 0) {
        const supportedChains = availableChainsByWallet[option as keyof typeof availableChainsByWallet] || [];
        setChains(supportedChains as Chain[]);
        setTimeout(() => handleConnection(option, provider), 100);
      } else {
        handleConnection(option, provider);
      }
    },
    [chains.length, handleConnection],
  );

  const eip6963Wallets = getEIP6963Wallets().providers;

  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      <ChainSelector chains={chains} loading={loading} setChains={setChains} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 300 }}>
        <div style={{ color: "#999", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>SELECT WALLET</div>
        <div
          style={{
            backgroundColor: "#0f0f0f",
            border: "1px solid #222",
            borderRadius: 6,
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: 5,
          }}>
          {walletOptions.map((option) => {
            const disabled = chains.length > 0 && isWalletDisabled(option);

            if (option === WalletOption.KEYSTORE) {
              return <KeystoreUpload key={option} onChange={handleKeystoreConnection} />;
            }

            return (
              <WalletButton
                disabled={disabled}
                key={option}
                onClick={() => handleWalletClick(option)}
                option={option}
              />
            );
          })}

          {eip6963Wallets.length > 0 && (
            <>
              <div
                style={{
                  borderTop: "1px solid #333",
                  color: "#666",
                  fontSize: 10,
                  fontWeight: 600,
                  gridColumn: "1 / -1",
                  marginTop: 8,
                  paddingLeft: 8,
                  paddingTop: 8,
                }}>
                EIP6963 WALLETS
              </div>
              {eip6963Wallets.map((wallet) => (
                <WalletButton
                  disabled={false}
                  key={wallet.info.name}
                  onClick={() => handleWalletClick(WalletOption.EIP6963, wallet.provider)}
                  option={wallet.info.name as WalletOption}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
