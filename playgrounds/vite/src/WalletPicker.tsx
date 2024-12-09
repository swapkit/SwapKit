import {
  Chain,
  CosmosChains,
  EVMChains,
  SubstrateChains,
  UTXOChains,
  WalletOption,
  getDerivationPathFor,
  getEIP6963Wallets,
} from "@swapkit/helpers";
import type { FullWallet } from "@swapkit/sdk";
import { decryptFromKeystore } from "@swapkit/wallet-keystore";
import { useCallback, useState } from "react";

import type { Eip1193Provider } from "@swapkit/toolbox-evm";
import { PHANTOM_SUPPORTED_CHAINS } from "@swapkit/wallet-phantom";
import type { SwapKitClient } from "./swapKitClient";

type Props = {
  setPhrase: (phrase: string) => void;
  setWallet: (wallet: FullWallet[Chain] | FullWallet[Chain][]) => void;
  skClient?: SwapKitClient;
};

const walletOptions = Object.values(WalletOption).filter((o) => ![WalletOption.EXODUS].includes(o));

const AllChainsSupported = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Polkadot,
  Chain.Maya,
  Chain.Kujira,
  Chain.THORChain,
  Chain.Solana,
] as Chain[];

export const availableChainsByWallet = {
  [WalletOption.BRAVE]: EVMChains,
  [WalletOption.COINBASE_MOBILE]: EVMChains,
  [WalletOption.COINBASE_WEB]: EVMChains,
  [WalletOption.EIP6963]: EVMChains,
  [WalletOption.KEPLR]: [Chain.Cosmos, Chain.Kujira],
  [WalletOption.LEAP]: [Chain.Cosmos, Chain.Kujira],
  [WalletOption.LEDGER]: AllChainsSupported,
  [WalletOption.METAMASK]: EVMChains,
  [WalletOption.OKX_MOBILE]: EVMChains,
  [WalletOption.PHANTOM]: PHANTOM_SUPPORTED_CHAINS,
  [WalletOption.POLKADOT_JS]: [Chain.Polkadot],
  [WalletOption.TRUSTWALLET_WEB]: EVMChains,
  [WalletOption.CTRL]: AllChainsSupported,
  [WalletOption.KEYSTORE]: [...AllChainsSupported, Chain.Polkadot],
  [WalletOption.KEEPKEY]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
    Chain.Maya,
  ],
  [WalletOption.KEEPKEY_BEX]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Base,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
    Chain.Maya,
  ],
  [WalletOption.TREZOR]: [
    Chain.Base,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Litecoin,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Optimism,
    Chain.Arbitrum,
    Chain.Polygon,
  ],

  [WalletOption.WALLETCONNECT]: [
    Chain.Ethereum,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Avalanche,
    Chain.THORChain,
    Chain.Maya,
    Chain.Polygon,
    Chain.Arbitrum,
    Chain.Optimism,
  ],
  [WalletOption.OKX]: [
    Chain.Ethereum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Cosmos,
    Chain.Polygon,
    Chain.Arbitrum,
    Chain.Optimism,
  ],
  [WalletOption.TALISMAN]: [
    Chain.Ethereum,
    Chain.Base,
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Polygon,
    Chain.BinanceSmartChain,
    Chain.Optimism,
    Chain.Polkadot,
  ],
  [WalletOption.EXODUS]: [Chain.Ethereum, Chain.BinanceSmartChain, Chain.Polygon, Chain.Bitcoin],
  [WalletOption.LEDGER_LIVE]: [],
  [WalletOption.RADIX_WALLET]: [Chain.Radix],
};

export const WalletPicker = ({ skClient, setWallet, setPhrase }: Props) => {
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState([]);

  const connectWallet = useCallback(
    async (option: WalletOption, provider?: Eip1193Provider) => {
      if (!skClient) return alert("client is not ready");
      switch (option) {
        case WalletOption.COINBASE_WEB:
        case WalletOption.METAMASK:
        case WalletOption.TRUSTWALLET_WEB:
        case WalletOption.EIP6963:
          // @ts-ignore
          return skClient.connectEVMWallet(chains, option, provider);
        case WalletOption.TALISMAN:
          // @ts-ignore
          return skClient.connectTalisman(chains);
        case WalletOption.KEPLR:
        case WalletOption.LEAP:
          // @ts-ignore
          return skClient.connectKeplr(chains, option.toLowerCase());
        case WalletOption.KEEPKEY: {
          const derivationPaths = chains.map((chain) => getDerivationPathFor({ chain, index: 0 }));

          await skClient.connectKeepkey?.(chains, derivationPaths);
          localStorage.setItem("keepkeyApiKey", "1234");
          return true;
        }
        case WalletOption.KEEPKEY_BEX:
          return skClient.connectKeepkeyBex?.(chains);
        case WalletOption.TREZOR:
        case WalletOption.LEDGER: {
          const [chain] = chains;
          if (!chain) return alert("chain is required");

          const connectMethod =
            WalletOption.TREZOR === option ? skClient.connectTrezor : skClient.connectLedger;

          return connectMethod?.(chains, getDerivationPathFor({ chain, index: 0 }));
        }

        case WalletOption.EXODUS:
        // @ts-ignore
        // return skClient.connectExodusWallet(chains, wallet);
        case WalletOption.COINBASE_MOBILE:
          return skClient.connectCoinbaseWallet?.(chains);
        case WalletOption.CTRL:
          return skClient.connectCtrl?.(chains);
        case WalletOption.OKX:
          return skClient.connectOkx?.(chains);
        case WalletOption.POLKADOT_JS:
          return skClient.connectPolkadotJs?.(chains as Chain.Polkadot[]);

        // case WalletOption.RADIX_WALLET:
        //   return skClient.connectRadixWallet?.();

        case WalletOption.PHANTOM:
          return skClient.connectPhantom?.(chains);
        case WalletOption.RADIX_WALLET:
          return skClient.connectRadixWallet?.([Chain.Radix]);

        default:
          throw new Error(`Unsupported wallet option: ${option}`);
      }
    },
    [chains, skClient],
  );

  const handleKeystoreConnection = useCallback(
    async ({ target }: any) => {
      if (!skClient) return alert("client is not ready");
      setLoading(true);

      const keystoreFile = await target.files[0].text();

      setTimeout(async () => {
        const password = prompt("Enter password");

        if (!password) return alert("password is required");
        try {
          const phrases = await decryptFromKeystore(JSON.parse(keystoreFile), password);
          setPhrase(phrases);

          await skClient.connectKeystore(chains, phrases);

          const walletDataArray = await Promise.all(
            chains.map((chain) => skClient.getWalletWithBalance(chain, true)),
          );

          setWallet(walletDataArray.filter(Boolean));
          setLoading(false);
        } catch (e) {
          console.error(e);
          alert(e);
        }
      }, 500);
    },
    [chains, setWallet, skClient, setPhrase],
  );

  const handleConnection = useCallback(
    async (option: WalletOption, provider?: Eip1193Provider) => {
      if (!skClient) return alert("client is not ready");
      setLoading(true);
      await connectWallet(option, provider);

      const walletDataArray = await Promise.all(
        chains.map((chain) => skClient.getWalletWithBalance(chain, true)),
      );

      setWallet(walletDataArray.filter(Boolean));
      setLoading(false);
    },
    [chains, connectWallet, setWallet, skClient],
  );

  const isWalletDisabled = useCallback(
    (wallet: WalletOption) =>
      chains.length > 0
        ? !chains.every((chain) =>
            // @ts-ignore
            availableChainsByWallet[wallet].includes(chain),
          )
        : false,
    [chains],
  );

  const handleChainSelect = useCallback((chain: Chain) => {
    setChains(
      (prev) =>
        (prev.includes(chain as never)
          ? prev.filter((c) => c !== chain)
          : [...prev, chain]) as never,
    );
  }, []);

  const handleMultipleSelect = useCallback((e: any) => {
    const selectedChains = Array.from(e.target.selectedOptions).map((o: any) => o.value);

    if (selectedChains.length > 1) {
      setChains(selectedChains as never);
    }
  }, []);

  const eip6963Wallets = getEIP6963Wallets().providers;

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ flexDirection: "column" }}>
        <select
          multiple
          onChange={handleMultipleSelect}
          style={{ width: 50, height: 400 }}
          value={chains}
        >
          {[
            ...EVMChains,
            ...CosmosChains,
            ...UTXOChains,
            ...SubstrateChains,
            Chain.Solana,
            Chain.Radix,
          ]
            .sort()
            .map((chain) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <option key={chain} onClick={() => handleChainSelect(chain)} value={chain}>
                {chain}
              </option>
            ))}
        </select>

        {loading && <div>Loading...</div>}
      </div>

      <div>
        {walletOptions.map((option) => (
          <div key={option} style={{ padding: "8px" }}>
            {option === WalletOption.KEYSTORE ? (
              <label className="label">
                <input
                  accept=".txt"
                  disabled={!chains.length}
                  id="keystoreFile"
                  name={option}
                  onChange={handleKeystoreConnection}
                  title="asdf"
                  type="file"
                />
                <span>{option}</span>
              </label>
            ) : (
              <button
                disabled={!chains.length || isWalletDisabled(option)}
                onClick={() => handleConnection(option)}
                type="button"
              >
                {option}
              </button>
            )}
          </div>
        ))}

        <span style={{ margin: 20 }}>EIP6963</span>
        {eip6963Wallets.map((wallet) => (
          <button
            key={wallet.info.name}
            onClick={() => handleConnection(WalletOption.EIP6963, wallet.provider)}
            type="button"
          >
            {wallet.info.name}
          </button>
        ))}
      </div>
    </div>
  );
};
