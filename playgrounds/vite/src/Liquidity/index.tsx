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
      baseAssetValue: nativeAssetValue,
      assetValue: otherAssetValue,
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
      percent: withdrawPercent,
      from: "sym",
      to: "baseAsset",
    });

    if (tx) setWithdrawTx(tx);
  }, [nativeAsset, pluginMode, withdrawPercent, skClient]);

  return (
    <div>
      <div>
        <div>
          <span>Plugin Type</span>
          <select
            onChange={(e) => {
              setPluginMode(e.target.value);
            }}
          >
            <option value={"thorplugin"}>ThorPlugin</option>
            <option value={"mayaplugin"}>MayaPlugin</option>
          </select>
        </div>

        <div>
          <span>Addliquidity / Withdraw</span>
          <select
            onChange={(e) => {
              setMode(e.target.value);
            }}
          >
            <option value={"addliquidity"}>Add Liquidity</option>
            <option value={"withdraw"}>Withdraw</option>
          </select>
        </div>
        <div>
          {mode === "addliquidity" && (
            <>
              <div>
                {pluginMode === "thorplugin" ? <span>Rune Asset:</span> : <span>Cacao Asset:</span>}
                {nativeAsset?.toSignificant(6)} {nativeAsset?.ticker}
                {pluginMode === "thorplugin" ? (
                  <div>
                    <span>Rune Amount:</span>
                    <input placeholder="0.0" onChange={(e) => setRuneAmount(e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <span>Cacao Amount:</span>
                    <input placeholder="0.0" onChange={(e) => setRuneAmount(e.target.value)} />
                  </div>
                )}
              </div>
              <div>
                <span>Other Asset:</span>
                {otherAsset?.toSignificant(6)} {otherAsset?.ticker}
                <div>
                  <span>Other Amount:</span>
                  <input placeholder="0.0" onChange={(e) => setOtherAmount(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {mode === "withdraw" && (
            <div>
              <span>Withdraw Asset:</span>
              {nativeAsset?.toSignificant(6)} {nativeAsset?.ticker}
              <div>
                <span>Withdraw Percent:</span>
                <input
                  type="number"
                  placeholder="0"
                  onChange={(e) => setWithdrawPercent(Number.parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {nativeAssetTx && <div>runeTx :{nativeAssetTx}</div>}

        {otherAssetTx && <div>assetTx :{otherAssetTx}</div>}

        {mode === "addliquidity" && (
          <div>
            <button type="button" onClick={handleAddLiquidity}>
              Add Liquidity
            </button>
          </div>
        )}
        {mode === "withdraw" && (
          <div>
            <button type="button" onClick={handleWithdraw}>
              Withdraw
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
