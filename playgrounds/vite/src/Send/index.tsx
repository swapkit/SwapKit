import { type AssetValue, getExplorerTxUrl } from "@swapkit/core";
import { useCallback, useState } from "react";
import type { SwapKitClient } from "../swapKitClient";

export default function Send({ inputAsset, skClient }: { skClient?: SwapKitClient; inputAsset?: AssetValue }) {
  const [inputAssetValue, setInput] = useState(inputAsset?.mul(0));
  const [inputString, setInputString] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleInputChange = useCallback(
    (value: string) => {
      if (!Number(value)) {
        setInputString(value);
        return;
      }
      setInputString(value);
      setInput(inputAssetValue ? inputAssetValue.set(value) : inputAsset?.set(value));
    },
    [inputAssetValue, inputAsset],
  );

  const handleSend = useCallback(async () => {
    if (!(inputAsset && inputAssetValue?.gt(0) && skClient)) return;

    const sender = skClient.getAddress(inputAsset.chain);
    const txHash = await skClient.transfer({ assetValue: inputAssetValue, memo: "", recipient, sender });

    window.open(`${getExplorerTxUrl({ chain: inputAssetValue.chain, txHash: txHash as string })}`, "_blank");
  }, [inputAsset, inputAssetValue, skClient, recipient]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: "#999", fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>Input Asset:</span> {inputAsset?.toSignificant(6)} {inputAsset?.ticker}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Input Amount:</label>
          <input
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0.0"
            style={{ fontSize: 13, width: "100%" }}
            value={Number(inputString) ? inputAssetValue?.getValue("string") : inputString}
          />
        </div>

        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Recipient:</label>
          <input
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="address"
            style={{ fontSize: 13, width: "100%" }}
            value={recipient}
          />
        </div>

        <button
          disabled={!inputAsset}
          onClick={handleSend}
          style={{
            backgroundColor: "#2563eb",
            borderColor: "#2563eb",
            color: "#fff",
            fontSize: 12,
            padding: "10px 16px",
          }}
          type="button">
          Send
        </button>
      </div>
    </div>
  );
}
