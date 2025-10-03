import { type Chain, SKConfig } from "@swapkit/helpers";
import { useCallback, useState } from "react";

type Props = { chains: Chain[]; setChains: (chains: Chain[]) => void; loading?: boolean };

export const ChainSelector = ({ chains, setChains, loading }: Props) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleChainSelect = useCallback(
    (chain: Chain, isDragAction = false) => {
      if (isDragAction) {
        setChains(chains.includes(chain) ? chains : [...chains, chain]);
      } else {
        setChains(chains.includes(chain) ? chains.filter((c) => c !== chain) : [...chains, chain]);
      }
    },
    [chains, setChains],
  );

  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseEnter = useCallback(
    (chain: Chain) => {
      if (isDragging) handleChainSelect(chain, true);
    },
    [isDragging, handleChainSelect],
  );

  const allChains = SKConfig.get("chains").concat().sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 240 }}>
      <div style={{ color: "#999", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>SELECT CHAINS</div>
      <div
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        style={{
          backgroundColor: "#0f0f0f",
          border: "1px solid #222",
          borderRadius: 6,
          display: "grid",
          gap: 5,
          gridTemplateColumns: "repeat(3, minmax(70px, 1fr))",
          maxHeight: 600,
          overflowY: "auto",
          padding: 6,
          userSelect: "none",
        }}>
        {allChains.map((chain) => {
          const isSelected = chains.includes(chain);
          return (
            <button
              key={chain}
              onClick={() => handleChainSelect(chain)}
              onMouseDown={handleMouseDown}
              onMouseEnter={() => handleMouseEnter(chain)}
              style={{
                backgroundColor: isSelected ? "#2563eb" : "#1a2a1a",
                borderColor: isSelected ? "#2563eb" : "#334433",
                color: isSelected ? "#fff" : "#a0d0a0",
                cursor: isDragging ? "grabbing" : "pointer",
                fontSize: 10,
                fontWeight: 500,
                padding: "6px 8px",
                textAlign: "center",
              }}
              type="button">
              {chain}
            </button>
          );
        })}
      </div>

      {loading && (
        <div
          style={{
            alignItems: "center",
            color: "#2563eb",
            display: "flex",
            fontSize: 10,
            gap: 6,
            justifyContent: "center",
            padding: 8,
          }}>
          <div
            style={{
              animation: "spin 1s linear infinite",
              border: "2px solid #333",
              borderRadius: "50%",
              borderTop: "2px solid #2563eb",
              height: 12,
              width: 12,
            }}
          />
          <span>Connecting...</span>
        </div>
      )}
    </div>
  );
};
