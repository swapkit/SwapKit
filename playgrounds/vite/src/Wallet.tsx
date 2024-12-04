import { type FullWallet, SwapKitApi, type WalletChain } from "@swapkit/sdk";

type Props = {
  walletData: FullWallet[WalletChain];
  setAsset: (asset: any) => void;
  disconnect: () => void;
};

export const Wallet = ({ walletData, setAsset, disconnect }: Props) => {
  if (!walletData) return null;

  return (
    <div style={{ paddingBottom: "16px" }}>
      <div>
        <span>
          {walletData?.walletType} {walletData?.balance?.[0]?.chain} wallet address:{" "}
          {walletData?.address}
        </span>
      </div>

      <span>Balances:</span>

      {walletData?.balance?.map((b) => (
        <div
          key={b.toString()}
          style={{
            flexDirection: "row",
            display: "flex",
            alignItems: "flex-start",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              position: "relative",
              top: 0,
              left: 0,
              height: "30px",
              width: "30px",
              marginRight: "8px",
            }}
          >
            <img
              style={{
                position: "relative",
                top: 0,
                left: 0,
                height: "30px",
                width: "30px",
              }}
              src={SwapKitApi.getLogoForAsset(b.toString())}
              alt=""
            />
            <img
              style={{
                position: "relative",
                top: "-19px",
                left: "18px",
                height: "15px",
                width: "15px",
              }}
              src={SwapKitApi.getChainLogoForAsset(b.toString())}
              alt=""
            />
          </div>
          <button onClick={() => setAsset(b)} type="button">
            {b.toSignificant(6)} {b.ticker}
          </button>
          <button onClick={() => disconnect()} type="button">
            Disconnect
          </button>
        </div>
      ))}
    </div>
  );
};
