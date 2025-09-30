import type { WalletOption } from "@swapkit/helpers";
import { availableChainsByWallet } from "../WalletPicker";

type Props = { option: WalletOption; disabled: boolean; onClick: () => void };

export const WalletButton = ({ option, disabled, onClick }: Props) => {
  const supportedChains = availableChainsByWallet[option as keyof typeof availableChainsByWallet] || [];
  const tooltipText = supportedChains.join(", ");

  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#1a1a2a",
        border: "1px solid #333344",
        borderRadius: 4,
        display: "flex",
        flex: 1,
        opacity: disabled ? 0.5 : 1,
        padding: "2px 3px",
      }}
      title={tooltipText}>
      <button
        onClick={onClick}
        style={{
          color: "#a0a0d0",
          cursor: "pointer",
          flex: 1,
          fontSize: 9,
          fontWeight: 500,
          padding: "2px 4px",
          textAlign: "center",
        }}
        title={tooltipText}
        type="button">
        {option}
      </button>
    </div>
  );
};
