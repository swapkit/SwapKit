import { WalletWidget } from "@passkeys/react";
import { type AssetValue, Chain, SKConfig } from "@swapkit/core";
import type { FullWallet } from "@swapkit/sdk";
import { SwapKitWidget } from "@swapkit/ui/react";
import { useCallback, useMemo, useState } from "react";
import Liquidity from "./Liquidity";
import Multisig from "./Multisig";
import NearNames from "./NearNames";
import Send from "./Send";
import Swap from "./Swap";
import { getSwapKitClient, resetSwapKitClient } from "./swapKitClient";
import TNS from "./TNS";
import { Wallet } from "./Wallet";
import { WalletPicker } from "./WalletPicker";

const apiKeys = ["walletConnectProjectId"] as const;

type WalletDataType = FullWallet[Chain] | FullWallet[Chain][] | null;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
const App = () => {
  const [feature, setFeature] = useState<"swap" | "send" | "liquidity" | "tns" | "multisig">("swap");
  const [wallet, setWallet] = useState<WalletDataType>(null);
  const [phrase, setPhrase] = useState("");
  const [stagenet, setStagenet] = useState(SKConfig.get("envs").isStagenet);
  const [loadingBalances, setLoadingBalances] = useState<Set<Chain>>(new Set());
  const [showWidget, setShowWidget] = useState(false);
  const [isDev, setIsDev] = useState(SKConfig.get("envs").isDev);

  const [keys, setKeys] = useState({
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

  const toggleBroker = useCallback(() => {
    setIsDev((v) => {
      const next = !v;
      SKConfig.setEnv("isDev", next);
      return next;
    });
  }, []);

  const setAsset = useCallback(
    (asset: AssetValue) => {
      if (!inputAsset) {
        setSwapAssets({ inputAsset: asset });
        return;
      }

      if (outputAsset) {
        setSwapAssets({ inputAsset: asset, outputAsset: undefined });
        return;
      }

      setSwapAssets({ inputAsset, outputAsset: asset });
    },
    [inputAsset, outputAsset],
  );

  const clearAssets = useCallback(() => {
    setSwapAssets({});
  }, []);

  const disconnectChain = (chain: Chain) => {
    if (!skClient) return;
    skClient.disconnectChain(chain);
    setWallet(Object.values(skClient.getAllWallets()));
    setLoadingBalances((prev) => {
      const next = new Set(prev);
      next.delete(chain);
      return next;
    });
  };

  const disconnectAll = () => {
    if (!skClient) return;
    skClient.disconnectAll();
    setWallet([]);
    setLoadingBalances(new Set());
  };

  const updateWalletBalance = useCallback(
    async (chain: Chain) => {
      if (!skClient) return;
      setLoadingBalances((prev) => new Set(prev).add(chain));
      try {
        const walletData = await skClient.getWalletWithBalance(chain, true);
        setWallet((prev) => {
          if (!prev) return [walletData];
          if (Array.isArray(prev)) {
            return prev.map((w) => (w.chain === chain ? walletData : w));
          }
          return prev.chain === chain ? walletData : prev;
        });
      } catch (e: any) {
        console.error(`Balance error ${chain}:`, e?.message || e);
      } finally {
        setLoadingBalances((prev) => {
          const next = new Set(prev);
          next.delete(chain);
          return next;
        });
      }
    },
    [skClient],
  );

  const refreshClient = useCallback(() => {
    resetSwapKitClient();
    setWallet([]);
    window.location.reload();
  }, []);

  const Screen = useMemo(
    () => ({
      liquidity: skClient ? <Liquidity nativeAsset={inputAsset} otherAsset={outputAsset} skClient={skClient} /> : null,
      multisig: skClient ? <Multisig inputAsset={inputAsset} phrase={phrase} skClient={skClient} /> : null,
      send: skClient ? <Send inputAsset={inputAsset} skClient={skClient} /> : null,
      swap: skClient ? <Swap inputAsset={inputAsset} outputAsset={outputAsset} skClient={skClient} /> : null,
      tns: skClient ? <TNS skClient={skClient} /> : null,
    }),
    [skClient, inputAsset, outputAsset, phrase],
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", width: "100%" }}>
      <div
        style={{
          backgroundColor: "#0f0f0f",
          borderRight: "1px solid #222",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          gap: 20,
          padding: 20,
          width: 200,
        }}>
        <h3 style={{ fontSize: 18, margin: 0 }}>SwapKit Playground</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "#999", fontSize: 11, fontWeight: 600 }}>CONFIGURATION</div>

          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => {
                if (stagenet) toggleStagenet();
              }}
              style={{
                backgroundColor: !stagenet ? "#2563eb" : "#1a1a1a",
                borderColor: !stagenet ? "#2563eb" : "#333",
                color: !stagenet ? "#fff" : "#e0e0e0",
                flex: 1,
                fontSize: 11,
                padding: "8px 12px",
              }}
              type="button">
              Mainnet
            </button>
            <button
              onClick={() => {
                if (!stagenet) toggleStagenet();
              }}
              style={{
                backgroundColor: stagenet ? "#2563eb" : "#1a1a1a",
                borderColor: stagenet ? "#2563eb" : "#333",
                color: stagenet ? "#fff" : "#e0e0e0",
                flex: 1,
                fontSize: 11,
                padding: "8px 12px",
              }}
              type="button">
              Stagenet
            </button>
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => {
                if (!isDev) toggleBroker();
              }}
              style={{
                backgroundColor: isDev ? "#2563eb" : "#1a1a1a",
                borderColor: isDev ? "#2563eb" : "#333",
                color: isDev ? "#fff" : "#e0e0e0",
                flex: 1,
                fontSize: 11,
                padding: "8px 12px",
              }}
              type="button">
              Dev API
            </button>
            <button
              onClick={() => {
                if (isDev) toggleBroker();
              }}
              style={{
                backgroundColor: !isDev ? "#2563eb" : "#1a1a1a",
                borderColor: !isDev ? "#2563eb" : "#333",
                color: !isDev ? "#fff" : "#e0e0e0",
                flex: 1,
                fontSize: 11,
                padding: "8px 12px",
              }}
              type="button">
              Prod API
            </button>
          </div>

          {apiKeys.map((key) => (
            <div key={key}>
              <label style={{ color: "#666", display: "block", fontSize: 10, marginBottom: 4 }}>{key}</label>
              <input
                onChange={(e) => setKeys((k) => ({ ...k, [key]: e.target.value }))}
                placeholder={key}
                style={{ fontSize: 11, width: "100%" }}
                value={keys[key]}
              />
            </div>
          ))}

          <div>
            <label style={{ color: "#666", display: "block", fontSize: 10, marginBottom: 4 }}>swapKitApiKey</label>
            <input
              onChange={(e) => setKeys((k) => ({ ...k, swapKit: e.target.value }))}
              placeholder="SwapKit API Key"
              style={{ fontSize: 11, width: "100%" }}
              value={keys.swapKit}
            />
          </div>

          <button
            onClick={refreshClient}
            style={{
              backgroundColor: "#2563eb",
              borderColor: "#2563eb",
              color: "#fff",
              fontSize: 11,
              marginTop: 12,
              padding: "10px 16px",
              width: "100%",
            }}
            type="button">
            Refresh Client
          </button>

          <button
            onClick={() => setShowWidget(!showWidget)}
            style={{
              backgroundColor: "#1a1a1a",
              borderColor: "#333",
              color: "#e0e0e0",
              fontSize: 11,
              marginTop: 8,
              padding: "10px 16px",
              width: "100%",
            }}
            type="button">
            {showWidget ? "Hide Widget" : "Show Widget"}
          </button>

          {skClient && (
            <div style={{ borderTop: "1px solid #222", marginTop: 16, paddingTop: 16 }}>
              <div style={{ color: "#666", fontSize: 10, fontWeight: 600, marginBottom: 8 }}>CURRENT CONFIG</div>
              <div style={{ color: "#555", display: "flex", flexDirection: "column", fontSize: 9, gap: 4 }}>
                <div>
                  <span style={{ color: "#888" }}>WalletConnect:</span>{" "}
                  {keys.walletConnectProjectId ? `${keys.walletConnectProjectId.slice(0, 8)}...` : "not set"}
                </div>
                <div>
                  <span style={{ color: "#888" }}>Broker:</span> {SKConfig.get("envs").isDev ? "dev" : "prod"}
                </div>
                <div>
                  <span style={{ color: "#888" }}>SwapKit API:</span>{" "}
                  {keys.swapKit ? `${keys.swapKit.slice(0, 8)}...` : "not set"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #222", marginTop: "auto", paddingTop: 12 }}>
          <div style={{ color: "#666", fontSize: 10, fontWeight: 600, marginBottom: 8 }}>ASSET SELECTION</div>
          {inputAsset || outputAsset ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {inputAsset && (
                <div
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: 4,
                    color: "#e0e0e0",
                    fontSize: 10,
                    padding: "6px 8px",
                  }}>
                  <span style={{ color: "#888" }}>From:</span> {inputAsset.ticker}
                </div>
              )}
              {outputAsset && (
                <div
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: 4,
                    color: "#e0e0e0",
                    fontSize: 10,
                    padding: "6px 8px",
                  }}>
                  <span style={{ color: "#888" }}>To:</span> {outputAsset.ticker}
                </div>
              )}
              <button
                onClick={clearAssets}
                style={{
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                  color: "#fff",
                  fontSize: 10,
                  marginTop: 2,
                  padding: "6px 10px",
                  width: "100%",
                }}
                type="button">
                Clear Selection
              </button>
            </div>
          ) : (
            <div style={{ color: "#555", fontSize: 9 }}>Click assets from wallets to select</div>
          )}
        </div>
      </div>

      {showWidget ? (
        <div style={{ display: "flex", padding: 20 }}>
          <SwapKitWidget apiKey={keys.swapKit} />
        </div>
      ) : (
        <div style={{ display: "flex", flex: 1, justifyContent: "flex-start", overflow: "hidden" }}>
          <div style={{ maxWidth: 1200, overflowY: "auto", padding: 20 }}>
            <div style={{ cursor: skClient ? "default" : "not-allowed" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  maxWidth: 1200,
                  opacity: skClient ? 1 : 0.5,
                  pointerEvents: skClient ? "all" : "none",
                }}>
                {skClient && (
                  <WalletPicker
                    setPhrase={setPhrase}
                    setWallet={(wallets) => {
                      setWallet(wallets);
                      if (Array.isArray(wallets)) {
                        for (const w of wallets) {
                          updateWalletBalance(w.chain);
                        }
                      } else if (wallets) {
                        updateWalletBalance(wallets.chain);
                      }
                    }}
                    skClient={skClient}
                  />
                )}

                <div style={{ maxWidth: 600 }}>
                  <div
                    style={{
                      borderBottom: "1px solid #222",
                      display: "flex",
                      gap: 4,
                      marginBottom: 16,
                      paddingBottom: 2,
                    }}>
                    {Object.keys(Screen).map((screen) => (
                      <button
                        key={screen}
                        onClick={() => setFeature(screen as "swap" | "send" | "liquidity" | "tns" | "multisig")}
                        style={{
                          backgroundColor: feature === screen ? "#1a1a1a" : "transparent",
                          borderBottom: feature === screen ? "2px solid #2563eb" : "none",
                          borderColor: feature === screen ? "#333" : "transparent",
                          color: feature === screen ? "#e0e0e0" : "#666",
                          fontSize: 11,
                          marginBottom: feature === screen ? -2 : 0,
                          padding: "8px 16px",
                        }}
                        type="button">
                        {screen.charAt(0).toUpperCase() + screen.slice(1)}
                      </button>
                    ))}
                  </div>

                  {Screen[feature]}
                </div>
              </div>
            </div>

            {skClient &&
              wallet &&
              (Array.isArray(wallet) ? wallet.some((w) => w.chain === Chain.Near) : wallet?.chain === Chain.Near) && (
                <NearNames skClient={skClient} />
              )}
          </div>

          <div
            style={{
              backgroundColor: "#0a0a0a",
              borderLeft: "1px solid #222",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              height: "100vh",
              overflowY: "auto",
              padding: 12,
              width: 700,
            }}>
            <WalletWidget />

            {skClient && wallet && (
              <>
                <div
                  style={{
                    alignItems: "center",
                    borderTop: "1px solid #222",
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    marginTop: 16,
                    paddingTop: 16,
                  }}>
                  <div style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>CONNECTED WALLETS</div>
                  <button onClick={disconnectAll} style={{ fontSize: 10, padding: "4px 8px" }} type="button">
                    Disconnect All
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(5, 1fr)" }}>
                  {Array.isArray(wallet) ? (
                    wallet.map((walletData) => (
                      <Wallet
                        disconnect={() => disconnectChain(walletData?.balance?.[0]?.chain as Chain)}
                        isLoadingBalance={loadingBalances.has(walletData.chain)}
                        key={`${walletData?.address}-${walletData?.balance?.[0]?.chain}`}
                        setAsset={setAsset}
                        walletData={walletData}
                      />
                    ))
                  ) : (
                    <Wallet
                      disconnect={() => disconnectChain(wallet?.balance?.[0]?.chain as Chain)}
                      isLoadingBalance={loadingBalances.has((wallet as FullWallet[Chain]).chain)}
                      key={`${wallet?.address}-${wallet?.balance?.[0]?.chain}`}
                      setAsset={setAsset}
                      walletData={wallet as FullWallet[Chain]}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
