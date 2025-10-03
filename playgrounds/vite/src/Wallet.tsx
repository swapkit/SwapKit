import { type Chain, type FullWallet, getExplorerAddressUrl } from "@swapkit/sdk";

type Props = {
  walletData: FullWallet[Chain];
  setAsset: (asset: any) => void;
  disconnect: () => void;
  isLoadingBalance?: boolean;
};

export const Wallet = ({ walletData, setAsset, disconnect, isLoadingBalance }: Props) => {
  if (!walletData) return null;

  const explorerUrl = getExplorerAddressUrl({ address: walletData.address, chain: walletData.chain });
  const hasBalances = walletData?.balance && walletData.balance.length > 0;

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
        padding: 10,
      }}>
      <div style={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, overflow: "hidden" }}>
          <strong style={{ color: "#e0e0e0", fontSize: 12 }}>{walletData?.chain}</strong>
          <a
            href={explorerUrl}
            rel="noopener noreferrer"
            style={{
              color: "#2563eb",
              fontSize: 10,
              overflow: "hidden",
              textDecoration: "none",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            target="_blank"
            title={walletData?.address}>
            {walletData?.address}
          </a>
        </div>
        <button onClick={() => disconnect()} style={{ fontSize: 9, padding: "4px 7px" }} type="button">
          Disconnect
        </button>
      </div>

      {isLoadingBalance && <div style={{ color: "#2563eb", fontSize: 10 }}>Loading...</div>}

      <div style={{ borderTop: "1px solid #333", display: "flex", flexDirection: "column", gap: 5, paddingTop: 6 }}>
        {!hasBalances && !isLoadingBalance && (
          <div
            style={{
              backgroundColor: "#0f0f0f",
              border: "1px solid #333",
              borderRadius: 4,
              color: "#666",
              fontSize: 10,
              padding: "6px",
              textAlign: "center",
            }}
            title="Balance is 0 or RPC/API error occurred">
            No balance
          </div>
        )}
        {hasBalances &&
          walletData.balance.map((b) => (
            <button
              key={b.toString()}
              onClick={() => setAsset(b)}
              style={{
                alignItems: "center",
                backgroundColor: "#0f0f0f",
                border: "1px solid #333",
                borderRadius: 4,
                display: "flex",
                fontSize: 10,
                gap: 6,
                justifyContent: "space-between",
                padding: "6px 8px",
              }}
              title={`${b.toSignificant(6)} ${b.ticker}`}
              type="button">
              <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
                <span style={{ color: "#e0e0e0", fontSize: 10 }}>{b.ticker}</span>
              </div>
              <span style={{ color: "#999", fontSize: 10 }}>{b.toSignificant(4)}</span>
            </button>
          ))}
      </div>
    </div>
  );
};
