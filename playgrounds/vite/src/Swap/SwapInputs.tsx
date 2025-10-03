"use client";
import { type EVMTransaction, type QuoteResponseRoute, SwapKitApi } from "@swapkit/helpers/api";
import type { AssetValue, Chain, SwapKit } from "@swapkit/sdk";
import { ProviderName, SwapKitNumber } from "@swapkit/sdk";
import { useCallback, useState } from "react";

type Props = {
  inputAsset?: AssetValue;
  outputAsset?: AssetValue;
  handleSwap: (route: QuoteResponseRoute, isChainflipBoost: boolean) => Promise<void>;
  skClient?: ReturnType<typeof SwapKit<{}, {}>>;
};

export const SwapInputs = ({ skClient, inputAsset, outputAsset, handleSwap }: Props) => {
  const [loading, setLoading] = useState(false);
  const [inputAssetValue, setInput] = useState<AssetValue | undefined>();
  const [routes, setRoutes] = useState<QuoteResponseRoute[]>([]);
  //   const [feeBestRoute, setFeeBestRoute] = useState<AssetValue | undefined>();
  const [useChainflipBoost, setUseChainflipBoost] = useState(true);

  const setAmount = useCallback(
    (amountValue: string) => {
      if (!inputAsset) return;

      const amount = inputAsset.set(amountValue);
      setInput(amount.gt(inputAsset) ? inputAsset : amount);
    },
    [inputAsset],
  );

  const fetchQuote = useCallback(async () => {
    if (!(inputAsset && outputAsset && inputAssetValue && skClient)) return;

    setLoading(true);
    setRoutes([]);

    const sourceAddress = skClient.getAddress(inputAsset.chain as Chain);
    const destinationAddress = skClient.getAddress(outputAsset.chain as Chain);
    // const providers = Object.values(ProviderName);

    try {
      const { routes } = await SwapKitApi.getSwapQuote({
        affiliateFee: 0,
        buyAsset: outputAsset.toString(),
        destinationAddress,
        includeTx: true,
        sellAmount: inputAssetValue.getValue("string"),
        sellAsset: inputAsset.toString(),
        slippage: 3,
        sourceAddress,
      });

      setRoutes(routes || []);
    } finally {
      setLoading(false);
    }
  }, [inputAssetValue, inputAsset, outputAsset, skClient]);

  const swap = async (route: QuoteResponseRoute, inputAssetValue?: AssetValue) => {
    if (!(inputAsset && outputAsset && inputAssetValue && skClient)) return;
    const isChainflip =
      route?.providers?.includes(ProviderName.CHAINFLIP) ||
      route?.providers?.includes(ProviderName.CHAINFLIP_STREAMING);
    if (isChainflip) {
      await handleSwap(route, useChainflipBoost);
      return;
    }

    const tx = route.tx as EVMTransaction;

    (tx?.from && (await skClient.isAssetValueApproved(inputAssetValue, tx?.from))) || !tx?.from
      ? handleSwap(route, false)
      : tx?.from
        ? skClient.approveAssetValue(inputAssetValue, tx?.from)
        : new Error("Approval Spender not found");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ color: "#999", fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>Input Asset:</span> {inputAsset?.toSignificant(6)} {inputAsset?.ticker}
        </div>
        <div style={{ color: "#999", fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>Output Asset:</span> {outputAsset?.toSignificant(6)} {outputAsset?.ticker}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Input Amount:</label>
          <input
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            style={{ fontSize: 13, width: "100%" }}
            value={inputAssetValue?.toSignificant(inputAssetValue.decimal)}
          />
        </div>

        <button
          disabled={!(inputAsset && outputAsset)}
          onClick={fetchQuote}
          style={{
            backgroundColor: "#2563eb",
            borderColor: "#2563eb",
            color: "#fff",
            fontSize: 12,
            padding: "10px 16px",
          }}
          type="button">
          {loading ? "Loading..." : "Get Quote"}
        </button>
      </div>

      {routes.length > 0 && (
        <div style={{ borderTop: "1px solid #222", display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
          <div style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>AVAILABLE ROUTES</div>
          {routes.map((route) => (
            <div
              key={route.targetAddress}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: 12,
              }}>
              {route?.providers?.includes(ProviderName.CHAINFLIP) && (
                <label style={{ alignItems: "center", color: "#999", display: "flex", fontSize: 11, gap: 6 }}>
                  <input
                    checked={useChainflipBoost}
                    onChange={(e) => setUseChainflipBoost(e.target.checked)}
                    type="checkbox"
                  />
                  Use Chainflip Boost
                </label>
              )}
              <div style={{ color: "#ccc", fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  Expected Output: <span style={{ color: "#fff", fontWeight: 600 }}>{route.expectedBuyAmount}</span>{" "}
                  {outputAsset?.ticker}
                </div>
                <div style={{ color: "#666", fontSize: 11 }}>
                  ~$
                  {new SwapKitNumber(route.expectedBuyAmount)
                    .mul(
                      route.meta.assets?.find(
                        (asset) => asset.asset.toLowerCase() === outputAsset?.toString().toLowerCase(),
                      )?.price || 0,
                    )
                    .toFixed(4)}
                </div>
              </div>
              <button
                onClick={() => swap(route, inputAssetValue)}
                style={{
                  backgroundColor: "#16a34a",
                  borderColor: "#16a34a",
                  color: "#fff",
                  fontSize: 12,
                  padding: "8px 14px",
                }}
                type="button">
                Execute Swap
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
