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
    <div>
      <h4>Send</h4>

      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <div>
          <div>
            <span>Input Asset: </span>
            {inputAsset?.toSignificant(6)} {inputAsset?.ticker}
          </div>
        </div>

        <div>
          <div>
            <span>Input Amount:</span>
            <input
              onChange={(e) => {
                handleInputChange(e.target.value);
              }}
              placeholder=""
              value={Number(inputString) ? inputAssetValue?.getValue("string") : inputString}
            />
          </div>

          <div>
            <span>Recipient:</span>
            <input onChange={(e) => setRecipient(e.target.value)} placeholder="address" value={recipient} />
          </div>

          <button disabled={!inputAsset} onClick={handleSend} type="button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
