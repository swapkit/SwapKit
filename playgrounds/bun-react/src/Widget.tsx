import "../styles/index.css";

import { Card, CardContent } from "@/components/ui/card";
import { Chain, WalletOption } from "@swapkit/helpers";
import { SwapKitWidget } from "@swapkit/ui/react";

export function Widget() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <a href="/">Back</a>

      <Card className="bg-card/50 backdrop-blur-sm border-muted">
        <CardContent className="pt-6">
          <SwapKitWidget
            apiKey="1234567890"
            config={{
              wallets: [WalletOption.CTRL],
              chains: [Chain.Cosmos, Chain.Bitcoin],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
