import { AssetValue } from "@swapkit/sdk";
import { loadTokenLists } from "@swapkit/tokens";
import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";

type Token = { identifier: string; ticker: string; chain: string };

type Props = { onSelectAsset: (asset: AssetValue) => void };

export const AssetSearch = ({ onSelectAsset }: Props) => {
  const [search, setSearch] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const lists = await loadTokenLists();
        const allTokens: Token[] = [];

        for (const list of Object.values(lists)) {
          for (const token of list.tokens) {
            allTokens.push({ chain: token.chain, identifier: token.identifier, ticker: token.ticker });
          }
        }

        setTokens(allTokens);
      } catch (e) {
        console.error("Failed to load tokens:", e);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  const fuse = useMemo(
    () => new Fuse(tokens, { includeScore: true, keys: ["ticker", "identifier"], threshold: 0.3 }),
    [tokens],
  );

  const results = useMemo(() => {
    if (!search.trim()) return [];
    return fuse.search(search).slice(0, 10);
  }, [search, fuse]);

  const handleSelect = useCallback(
    (token: Token) => {
      try {
        const asset = AssetValue.from({ asset: token.identifier });
        onSelectAsset(asset);
        setSearch("");
      } catch (e) {
        console.error("Failed to create AssetValue:", e);
      }
    },
    [onSelectAsset],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <label style={{ color: "#666", display: "block", fontSize: 10, marginBottom: 4 }}>Search Tokens</label>
        <input
          disabled={loading}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={loading ? "Loading tokens..." : "Search by ticker (e.g., USDC, ETH)"}
          style={{ fontSize: 11, width: "100%" }}
          value={search}
        />
      </div>

      {results.length > 0 && (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: 300,
            overflowY: "auto",
            padding: 4,
          }}>
          {results.map(({ item }) => (
            <button
              key={item.identifier}
              onClick={() => handleSelect(item)}
              style={{
                alignItems: "center",
                backgroundColor: "#0f0f0f",
                border: "1px solid #333",
                borderRadius: 3,
                display: "flex",
                fontSize: 10,
                gap: 8,
                justifyContent: "space-between",
                padding: "8px 10px",
                textAlign: "left",
              }}
              type="button">
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{item.ticker}</span>
                <span style={{ color: "#666", fontSize: 9 }}>{item.chain}</span>
              </div>
              <span style={{ color: "#999", fontSize: 9 }}>{item.identifier}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
