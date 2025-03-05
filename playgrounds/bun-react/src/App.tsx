import "./index.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chain, WalletOption } from "@swapkit/core";
import { SwapKitProvider, useSwapKit } from "@swapkit/ui/react";
import { useCallback, useEffect } from "react";

function Content() {
  const { connect, getClient } = useSwapKit<["chainflip", "evm"]>();

  const connectSwapKit = useCallback(async () => {
    const skClient = await connect({
      walletOption: WalletOption.CTRL,
      chains: [Chain.Cosmos, Chain.Bitcoin],
    });

    console.info(skClient.getAllWallets());
  }, [connect]);

  useEffect(() => {
    connectSwapKit();
  }, [connectSwapKit]);

  const runTx = useCallback(() => {
    const client = getClient();

    console.info(client.getAllWallets());
  }, [getClient]);

  const wallets = Object.values(getClient()?.getAllWallets() || {});

  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <Card className="bg-card/50 backdrop-blur-sm border-muted">
        <CardContent className="pt-6">
          {wallets?.[0]?.walletType}

          {wallets?.map((wallet) => (
            <div key={wallet.address}>
              {wallet.chain} - {wallet.address}
            </div>
          ))}

          <Button onClick={runTx}>Run Tx</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function App() {
  return (
    <SwapKitProvider config={{ apiKeys: { swapKit: "1234567890" } }} plugins={["chainflip", "evm"]}>
      <Content />
    </SwapKitProvider>
  );
}
