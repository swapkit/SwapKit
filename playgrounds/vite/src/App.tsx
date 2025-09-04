import { WalletWidget } from "@passkeys/react";
import { type AssetValue, Chain, SKConfig } from "@swapkit/core";
import type { FullWallet } from "@swapkit/sdk";
import { useCallback, useMemo, useState } from "react";
import Liquidity from "./Liquidity";
import Multisig from "./Multisig";
import NearNames from "./NearNames";
import Send from "./Send";
import Swap from "./Swap";
import { getSwapKitClient } from "./swapKitClient";
import TNS from "./TNS";
import { Wallet } from "./Wallet";
import { WalletPicker } from "./WalletPicker";

const apiKeys = ["walletConnectProjectId"] as const;

type WalletDataType = FullWallet[Chain] | FullWallet[Chain][] | null;

const App = () => {
  const [feature, setFeature] = useState<"swap" | "earn">("swap");
  const [wallet, setWallet] = useState<WalletDataType>(null);
  const [phrase, setPhrase] = useState("");
  const [stagenet, setStagenet] = useState(false);

  const [keys, setKeys] = useState({
    brokerEndpoint: "https://dev-api.swapkit.dev/chainflip/broker",
    swapKit: (import.meta.env.VITE_TEST_API_KEY || "") as string,
    walletConnectProjectId: (import.meta.env.WALLETCONNECT_PROJECT_ID || "") as string,
  });

  const [{ inputAsset, outputAsset }, setSwapAssets] = useState<{ inputAsset?: AssetValue; outputAsset?: AssetValue }>(
    {},
  );

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
      earn: <div>Earn</div>,
      liquidity: skClient ? <Liquidity nativeAsset={inputAsset} otherAsset={outputAsset} skClient={skClient} /> : null,
      multisig: skClient ? <Multisig inputAsset={inputAsset} phrase={phrase} skClient={skClient} /> : null,
      send: skClient ? <Send inputAsset={inputAsset} skClient={skClient} /> : null,
      swap: skClient ? <Swap inputAsset={inputAsset} outputAsset={outputAsset} skClient={skClient} /> : null,
      tns: skClient ? <TNS skClient={skClient} /> : null,
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
            opacity: skClient ? 1 : 0.5,
            pointerEvents: skClient ? "all" : "none",
          }}>
          <div style={{ display: "flex", flex: 1, flexDirection: "row" }}>
            {skClient && <WalletPicker setPhrase={setPhrase} setWallet={setWallet} skClient={skClient} />}

            <div>
              <select onChange={(e) => setFeature(e.target.value as "swap" | "earn")} style={{ marginBottom: 10 }}>
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
                  Disconnect All: {Array.isArray(wallet) ? wallet[0]?.walletType : wallet?.walletType}
                </button>

                {Array.isArray(wallet) ? (
                  wallet.map((walletData) => (
                    <Wallet
                      disconnect={() => disconnectChain(walletData?.balance?.[0]?.chain as Chain)}
                      key={`${walletData?.address}-${walletData?.balance?.[0]?.chain}`}
                      setAsset={setAsset}
                      walletData={walletData}
                    />
                  ))
                ) : (
                  <Wallet
                    disconnect={() => disconnectChain(wallet?.balance?.[0]?.chain as Chain)}
                    key={`${wallet?.address}-${wallet?.balance?.[0]?.chain}`}
                    setAsset={setAsset}
                    walletData={wallet as FullWallet[Chain]}
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
        (Array.isArray(wallet) ? wallet.some((w) => w.chain === Chain.Near) : wallet?.chain === Chain.Near) && (
          <NearNames skClient={skClient} />
        )}
    </div>
  );
};

export default App;
