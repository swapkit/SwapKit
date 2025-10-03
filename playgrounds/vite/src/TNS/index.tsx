import { AllChains, AssetValue, Chain, getExplorerTxUrl, SwapKitApi, type THORNameDetails } from "@swapkit/sdk";
import { useCallback, useState } from "react";
import type { SwapKitClient } from "../swapKitClient";

export default function TNS({ skClient }: { skClient: SwapKitClient }) {
  const [selectedChain, setSelectedChain] = useState<Chain>(Chain.THORChain);
  const [name, setName] = useState("");
  const [tnsSearch, setTnsSearch] = useState("");
  const [tnsDetail, setTnsDetail] = useState<THORNameDetails>();

  const checkTns = useCallback(async () => {
    const tnsDetail = await SwapKitApi.thorchainMidgard.getNameDetails(tnsSearch);
    setTnsDetail(tnsDetail);
  }, [tnsSearch]);

  const registerTns = useCallback(async () => {
    // const owner = skClient.getAddress(Chain.THORChain);
    const address = skClient.getAddress(selectedChain);

    try {
      const txHash = await skClient.thorchain.registerName({
        address,
        assetValue: AssetValue.from({ chain: Chain.THORChain, value: 1 }),
        chain: selectedChain,
        name,
      });

      window.open(`${getExplorerTxUrl({ chain: Chain.THORChain, txHash })}`, "_blank");
    } catch (e) {
      console.error(e);
      alert(e);
    }
  }, [name, selectedChain, skClient]);

  return (
    <div>
      <h3>TNS</h3>

      <div>
        <span>Check TNS info</span>
        <input onChange={(e) => setTnsSearch(e.target.value)} value={tnsSearch} />
        <button onClick={checkTns} type="button">
          Check
        </button>

        {tnsDetail && <div>{JSON.stringify(tnsDetail)}</div>}
      </div>

      <div style={{ cursor: skClient ? "default" : "not-allowed" }}>
        <div style={{ opacity: skClient ? 1 : 0.5, pointerEvents: skClient ? "all" : "none" }}>
          <div style={{ display: "flex", flex: 1, flexDirection: "row" }}>
            <div>
              <select onChange={(e) => setSelectedChain(e.target.value as Chain)}>
                {AllChains.map((chain) => (
                  <option key={chain} value={chain}>
                    {chain}
                  </option>
                ))}
              </select>

              <input onChange={(e) => setName(e.target.value)} value={name} />

              <button onClick={registerTns} type="button">
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
