import { type Chain, type FullWallet, SwapKitApi } from "@swapkit/sdk";

type Props = { walletData: FullWallet[Chain]; setAsset: (asset: any) => void; disconnect: () => void };

export const Wallet = ({ walletData, setAsset, disconnect }: Props) => {
  if (!walletData) return null;

  return (
    <div style={{ paddingBottom: "8px" }}>
      <div>
        <span>
          {walletData?.chain} address: {walletData?.address}
        </span>
      </div>

      <span>Balances:</span>

      {walletData?.balance?.map((b) => (
        <div
          key={b.toString()}
          style={{ alignItems: "flex-start", display: "flex", flexDirection: "row", marginBottom: "8px" }}>
          <div style={{ height: "30px", left: 0, marginRight: "8px", position: "relative", top: 0, width: "30px" }}>
            <img
              alt=""
              src={SwapKitApi.getLogoForAsset(b.toString())}
              style={{ height: "30px", left: 0, position: "relative", top: 0, width: "30px" }}
            />
            <img
              alt=""
              src={SwapKitApi.getChainLogoForAsset(b.toString())}
              style={{ height: "15px", left: "18px", position: "relative", top: "-19px", width: "15px" }}
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
