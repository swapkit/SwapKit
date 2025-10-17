"use client";

import { ArrowLeftRight, ChevronRight, TimerIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";

export function SwapQuotePreview() {
  return (
    <Card>
      <CardContent>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary" />

            <div className="font-medium">1inch</div>

            <div className="rounded bg-success px-1 py-0.5 text-success-foreground text-xs">Best</div>
          </div>

          <div className="!ml-auto mr-4 flex items-center gap-1 text-muted-foreground text-sm">
            <TimerIcon className="size-4" />

            <span>00m 12s</span>
          </div>

          <div className="font-medium text-foreground">1894.42 USDT</div>

          <ChevronRight className="ml-2 size-4 text-foreground" />
        </CardHeader>

        <div className="-mx-4 -mb-6 flex items-center rounded-b-lg border-card border-r border-b border-l bg-background p-4 text-sm">
          <ArrowLeftRight className="size-4 text-muted-foreground" />

          <span className="ml-2">1 USDT ≈ 0.00052448 ETH</span>

          <span className="ml-auto font-medium">Fees: $0.161711</span>

          <ChevronRight className="ml-2 size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
