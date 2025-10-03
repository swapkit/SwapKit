import { WalletOption } from "@swapkit/helpers";
import { availableChainsByWallet } from "../WalletPicker";

type Props = { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void };

export const KeystoreUpload = ({ onChange }: Props) => {
  const supportedChains = availableChainsByWallet[WalletOption.KEYSTORE] || [];
  const tooltipText = supportedChains.join(", ");

  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#1a1a2a",
        border: "1px solid #333344",
        borderRadius: 4,
        display: "flex",
        padding: "2px 3px",
      }}
      title={tooltipText}>
      <label
        className="label"
        style={{
          color: "#a0a0d0",
          flex: 1,
          fontSize: 9,
          fontWeight: 500,
          margin: 0,
          padding: "2px 4px",
          textAlign: "center",
        }}
        title={tooltipText}>
        <input accept=".txt" disabled={false} id="keystoreFile" name="keystore" onChange={onChange} type="file" />
        <span>KEYSTORE</span>
      </label>
    </div>
  );
};
