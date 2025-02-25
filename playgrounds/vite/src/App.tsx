import { type AssetValue, type Chain, type FullWallet, SKConfig } from "@swapkit/core";
import { WalletWidget } from "@swapkit/wallets/exodus";
import { useCallback, useMemo, useState } from "react";

import Liquidity from "./Liquidity";
import Multisig from "./Multisig";
import Send from "./Send";
import Swap from "./Swap";
import TNS from "./TNS";
import { Wallet } from "./Wallet";
import { WalletPicker } from "./WalletPicker";
import { getSwapKitClient } from "./swapKitClient";

const apiKeys = ["walletConnectProjectId"] as const;

type WalletDataType = FullWallet[Chain] | FullWallet[Chain][] | null;

const App = () => {
  const [widgetType, setWidgetType] = useState<"swap" | "earn">("swap");
  const [wallet, setWallet] = useState<WalletDataType>(null);
  const [phrase, setPhrase] = useState("");
  const [stagenet, setStagenet] = useState(false);
  /**
   * NOTE: Test API keys - please use your own API keys in app as those will timeout, reach limits, etc.
   */
  const [keys, setKeys] = useState({
    blockchair: (import.meta.env.VITE_BLOCKCHAIR_API_KEY ||
      "A___Tcn5B16iC3mMj7QrzZCb2Ho1QBUf") as string,
    covalent: (import.meta.env.VITE_COVALENT_API_KEY ||
      "cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q") as string,
    ethplorer: (import.meta.env.VITE_ETHPLORER_API_KEY || "freekey") as string,
    walletConnectProjectId: "",
    brokerEndpoint: "https://dev-api.swapkit.dev/channel",
  });

  const [{ inputAsset, outputAsset }, setSwapAssets] = useState<{
    inputAsset?: AssetValue;
    outputAsset?: AssetValue;
  }>({});

  const skClient = getSwapKitClient(keys);

  const toggleStagenet = useCallback(() => {
    setStagenet((v) => {
      const next = !v;
      SKConfig.setEnv("isStagenet", next);
      return next;
    });
  }, []);

  const setAsset = useCallback(
    (asset: AssetValue) => {
      if (!inputAsset) {
        setSwapAssets({ inputAsset: asset });
      }

      if (outputAsset) {
        setSwapAssets({ inputAsset: asset, outputAsset: undefined });
      } else {
        setSwapAssets({ inputAsset, outputAsset: asset });
      }
    },
    [inputAsset, outputAsset],
  );

  const disconnectChain = (chain: Chain) => {
    if (!skClient) return;
    skClient.disconnectChain(chain);
    setWallet(Object.values(skClient.getAllWallets()));
  };

  const disconnectAll = () => {
    if (!skClient) return;
    skClient.disconnectAll();
    setWallet([]);
  };

  const Widgets = useMemo(
    () => ({
      swap: skClient ? (
        <Swap inputAsset={inputAsset} outputAsset={outputAsset} skClient={skClient} />
      ) : null,
      tns: skClient ? <TNS skClient={skClient} /> : null,
      send: skClient ? <Send inputAsset={inputAsset} skClient={skClient} /> : null,
      earn: <div>Earn</div>,
      multisig: skClient ? (
        <Multisig inputAsset={inputAsset} phrase={phrase} skClient={skClient} />
      ) : null,
      liquidity: skClient ? (
        <Liquidity otherAsset={outputAsset} nativeAsset={inputAsset} skClient={skClient} />
      ) : null,
    }),
    [skClient, inputAsset, outputAsset, phrase],
  );

  return (
    <div>
      <h3>
        SwapKit Playground -{" "}
        <div>
          {apiKeys.map((key) => (
            <input
              key={key}
              onChange={(e) => setKeys((k) => ({ ...k, [key]: e.target.value }))}
              placeholder={key}
              value={keys[key]}
            />
          ))}
        </div>
        <button onClick={toggleStagenet} type="button">
          Toggle Stagenet - Currently = {`${stagenet}`.toUpperCase()}
        </button>
      </h3>

      <div style={{ cursor: skClient ? "default" : "not-allowed" }}>
        <div
          style={{
            pointerEvents: skClient ? "all" : "none",
            opacity: skClient ? 1 : 0.5,
          }}
        >
          <div style={{ display: "flex", flex: 1, flexDirection: "row" }}>
            {skClient && (
              <WalletPicker setPhrase={setPhrase} setWallet={setWallet} skClient={skClient} />
            )}

            <div>
              <select
                onChange={(e) => setWidgetType(e.target.value as "swap")}
                style={{ marginBottom: 10 }}
              >
                {Object.keys(Widgets).map((widget) => (
                  <option key={widget} value={widget}>
                    {widget}
                  </option>
                ))}
              </select>

              {Widgets[widgetType]}
            </div>
          </div>

          {skClient && (
            <>
              <button onClick={disconnectAll} type="button">
                Disconnect All
              </button>
              {Array.isArray(wallet) ? (
                wallet.map((walletData) => (
                  <Wallet
                    key={`${walletData?.address}-${walletData?.balance?.[0]?.chain}`}
                    setAsset={setAsset}
                    walletData={walletData}
                    disconnect={() => disconnectChain(walletData?.balance?.[0]?.chain as Chain)}
                  />
                ))
              ) : (
                <Wallet
                  key={`${wallet?.address}-${wallet?.balance?.[0]?.chain}`}
                  setAsset={setAsset}
                  walletData={wallet as FullWallet[Chain]}
                  disconnect={() => disconnectChain(wallet?.balance?.[0]?.chain as Chain)}
                />
              )}
            </>
          )}
          <WalletWidget />
        </div>
      </div>
    </div>
  );
};

export default App;
