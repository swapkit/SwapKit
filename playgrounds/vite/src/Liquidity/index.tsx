"use client";
import type { AssetValue } from "@swapkit/sdk";
import { useCallback, useState } from "react";
import type { SwapKitClient } from "../swapKitClient";

export default function Liquidity({
  otherAsset,
  nativeAsset,
  skClient,
}: {
  skClient: SwapKitClient;
  otherAsset?: AssetValue;
  nativeAsset?: AssetValue;
}) {
  const [nativeAssetValue, setNativeInput] = useState<AssetValue | undefined>();
  const [otherAssetValue, setOtherInput] = useState<AssetValue | undefined>();
  const [otherAssetTx, setOtherAssetTx] = useState<string>("");
  const [nativeAssetTx, setNativeAssetTx] = useState<string>("");
  const [mode, setMode] = useState<string>("addliquidity");
  const [pluginMode, setPluginMode] = useState<string>("thorplugin");
  const [_withdrawTx, setWithdrawTx] = useState<string>("");
  const [withdrawPercent, setWithdrawPercent] = useState<number>(0);

  const setRuneAmount = useCallback(
    (amountValue: string) => {
      if (!nativeAsset) return;

      // ... LoL
      const amount = nativeAsset.mul(0).add(amountValue);

      setNativeInput(amount.gt(nativeAsset) ? nativeAsset : amount);
    },
    [nativeAsset],
  );

  const setOtherAmount = useCallback(
    (amountValue: string) => {
      if (!otherAsset) return;

      // ... LoL
      const amount = otherAsset.mul(0).add(amountValue);

      setOtherInput(amount.gt(otherAsset) ? otherAsset : amount);
    },
    [otherAsset],
  );

  const handleAddLiquidity = useCallback(async () => {
    if (!(nativeAssetValue && otherAssetValue)) return;
    const plugin = pluginMode === "mayaplugin" ? skClient.mayachain : skClient.thorchain;

    const result = await plugin.addLiquidity({
      assetValue: otherAssetValue,
      baseAssetValue: nativeAssetValue,
      mode: "sym",
    });
    if (result?.baseAssetTx) {
      setNativeAssetTx(result?.baseAssetTx);
    }
    if (result?.assetTx) {
      setOtherAssetTx(result?.assetTx);
    }
  }, [nativeAssetValue, otherAssetValue, pluginMode, skClient]);

  const handleWithdraw = useCallback(async () => {
    if (!nativeAsset) return;
    const plugin = pluginMode === "mayaplugin" ? skClient.mayachain : skClient.thorchain;

    const tx = await plugin.withdraw({
      assetValue: nativeAsset,
      from: "sym",
      percent: withdrawPercent,
      to: "baseAsset",
    });

    if (tx) setWithdrawTx(tx);
  }, [nativeAsset, pluginMode, withdrawPercent, skClient]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Plugin Type</label>
          <select
            onChange={(e) => setPluginMode(e.target.value)}
            style={{ fontSize: 12, padding: "8px 12px", width: "100%" }}>
            <option value={"thorplugin"}>ThorPlugin</option>
            <option value={"mayaplugin"}>MayaPlugin</option>
          </select>
        </div>

        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>
            Add Liquidity / Withdraw
          </label>
          <select
            onChange={(e) => setMode(e.target.value)}
            style={{ fontSize: 12, padding: "8px 12px", width: "100%" }}>
            <option value={"addliquidity"}>Add Liquidity</option>
            <option value={"withdraw"}>Withdraw</option>
          </select>
        </div>
        {mode === "addliquidity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: "#999", fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{pluginMode === "thorplugin" ? "Rune Asset:" : "Cacao Asset:"}</span>{" "}
              {nativeAsset?.toSignificant(6)} {nativeAsset?.ticker}
            </div>
            <div>
              <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>
                {pluginMode === "thorplugin" ? "Rune Amount:" : "Cacao Amount:"}
              </label>
              <input
                onChange={(e) => setRuneAmount(e.target.value)}
                placeholder="0.0"
                style={{ fontSize: 13, width: "100%" }}
              />
            </div>
            <div style={{ color: "#999", fontSize: 12, marginBottom: 4, marginTop: 8 }}>
              <span style={{ fontWeight: 600 }}>Other Asset:</span> {otherAsset?.toSignificant(6)} {otherAsset?.ticker}
            </div>
            <div>
              <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Other Amount:</label>
              <input
                onChange={(e) => setOtherAmount(e.target.value)}
                placeholder="0.0"
                style={{ fontSize: 13, width: "100%" }}
              />
            </div>
          </div>
        )}

        {mode === "withdraw" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: "#999", fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>Withdraw Asset:</span> {nativeAsset?.toSignificant(6)}{" "}
              {nativeAsset?.ticker}
            </div>
            <div>
              <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>
                Withdraw Percent:
              </label>
              <input
                onChange={(e) => setWithdrawPercent(Number.parseInt(e.target.value, 10))}
                placeholder="0"
                style={{ fontSize: 13, width: "100%" }}
                type="number"
              />
            </div>
          </div>
        )}

        {nativeAssetTx && (
          <div style={{ backgroundColor: "#1a1a1a", borderRadius: 4, color: "#16a34a", fontSize: 11, padding: 8 }}>
            runeTx: {nativeAssetTx}
          </div>
        )}

        {otherAssetTx && (
          <div style={{ backgroundColor: "#1a1a1a", borderRadius: 4, color: "#16a34a", fontSize: 11, padding: 8 }}>
            assetTx: {otherAssetTx}
          </div>
        )}

        {mode === "addliquidity" && (
          <button
            onClick={handleAddLiquidity}
            style={{
              backgroundColor: "#2563eb",
              borderColor: "#2563eb",
              color: "#fff",
              fontSize: 12,
              marginTop: 8,
              padding: "10px 16px",
            }}
            type="button">
            Add Liquidity
          </button>
        )}
        {mode === "withdraw" && (
          <button
            onClick={handleWithdraw}
            style={{
              backgroundColor: "#dc2626",
              borderColor: "#dc2626",
              color: "#fff",
              fontSize: 12,
              marginTop: 8,
              padding: "10px 16px",
            }}
            type="button">
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}
