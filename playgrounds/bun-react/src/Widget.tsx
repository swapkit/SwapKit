import "../styles/index.css";

import { Chain, WalletOption } from "@swapkit/helpers";
import { SwapKitWidget } from "@swapkit/ui/react";
import { Card, CardContent } from "@/components/ui/card";

export function Widget() {
  return (
    <div className="container relative z-10 mx-auto p-8 text-center">
      <a href="/">Back</a>

      <Card className="border-muted bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <SwapKitWidget
            apiKey="1234567890"
            config={{ chains: [Chain.Cosmos, Chain.Bitcoin], wallets: [WalletOption.CTRL] }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
