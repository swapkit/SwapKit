import { type AssetValue, Chain, type FullWallet, SKConfig } from "@swapkit/core";
import { WalletWidget } from "@swapkit/wallets/exodus";
import { useCallback, useMemo, useState } from "react";

import Liquidity from "./Liquidity";
import Multisig from "./Multisig";
import NearNames from "./NearNames";
import Send from "./Send";
import Swap from "./Swap";
import TNS from "./TNS";
import { Wallet } from "./Wallet";
import { WalletPicker } from "./WalletPicker";
import { getSwapKitClient } from "./swapKitClient";

const apiKeys = ["walletConnectProjectId"] as const;

type WalletDataType = FullWallet[Chain] | FullWallet[Chain][] | null;

const App = () => {
  const [feature, setFeature] = useState<"swap" | "earn">("swap");
  const [wallet, setWallet] = useState<WalletDataType>(null);
  const [phrase, setPhrase] = useState("");
  const [stagenet, setStagenet] = useState(false);

  const [keys, setKeys] = useState({
    swapKit: (import.meta.env.VITE_TEST_API_KEY || "") as string,
    walletConnectProjectId: "",
    brokerEndpoint: "https://dev-api.swapkit.dev/chainflip/broker",
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

  const Screen = useMemo(
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
        SwapKit Playground
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
            display: "flex",
            flexDirection: "row",
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
                onChange={(e) => setFeature(e.target.value as "swap" | "earn")}
                style={{ marginBottom: 10 }}
              >
                {Object.keys(Screen).map((screen) => (
                  <option key={screen} value={screen}>
                    {screen}
                  </option>
                ))}
              </select>

              {Screen[feature]}
            </div>
          </div>

          <div>
            {skClient && (
              <>
                <button onClick={disconnectAll} type="button">
                  Disconnect All:{" "}
                  {Array.isArray(wallet) ? wallet[0]?.walletType : wallet?.walletType}
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
          </div>

          <WalletWidget />
        </div>
      </div>

      {/* NEAR Names Registration Modal - Only render when NEAR wallet is connected */}
      {skClient &&
        wallet &&
        (Array.isArray(wallet)
          ? wallet.some((w) => w.chain === Chain.Near)
          : wallet?.chain === Chain.Near) && <NearNames skClient={skClient} />}
    </div>
  );
};

export default App;
