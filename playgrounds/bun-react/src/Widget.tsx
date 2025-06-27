import "../styles/globals.css";
import "@swapkit/ui/styles";

import { Chain, WalletOption } from "@swapkit/core";
import { SwapKitWidget } from "@swapkit/ui/react";

export function Widget() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <a href="/" className="absolute top-4 left-4 text-white/60 hover:text-white">
        ← Back
      </a>

      <SwapKitWidget
        apiKey="230473ca-3631-4bcf-a6f4-19862f70b473"
        config={{
          wallets: [WalletOption.CTRL],
          chains: [Chain.Ethereum, Chain.Bitcoin],
        }}
      />
    </div>
  );
}
