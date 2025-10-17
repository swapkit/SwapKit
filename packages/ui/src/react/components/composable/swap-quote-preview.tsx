"use client";

import { AssetValue, type QuoteResponseRoute } from "@swapkit/sdk";
import { ArrowLeftRight, ChevronRight, InfoIcon, TimerIcon } from "lucide-react";
import { useMemo } from "react";
import { temp_host } from "../asset-icon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Card, CardContent, CardHeader } from "../ui/card";

export function SwapQuotePreview({
  className,
  selectedRoute,
}: {
  className?: string;
  selectedRoute: QuoteResponseRoute;
}) {
  const formattedEstimatedTime = useMemo(() => {
    if (!selectedRoute?.estimatedTime?.total) return "00m 00s";

    const hours = Math.floor(selectedRoute?.estimatedTime?.total / 3600);
    const minutes = Math.floor((selectedRoute?.estimatedTime?.total % 3600) / 60);
    const seconds = selectedRoute?.estimatedTime?.total % 60;

    return `${hours ? `${hours.toFixed(0)}h ` : ""}${`${minutes.toFixed(0)}m `}${`${seconds.toFixed(0)}s`}`;
  }, [selectedRoute?.estimatedTime?.total]);

  const providerName = selectedRoute?.providers?.[0] ?? "Unknown";
  const sellAsset = selectedRoute?.sellAsset
    ? AssetValue.from({ asset: selectedRoute?.sellAsset })
    : { ticker: "Unknown" };
  const buyAsset = selectedRoute?.buyAsset
    ? AssetValue.from({ asset: selectedRoute?.buyAsset })
    : { ticker: "Unknown" };

  return (
    <Card className={className}>
      <CardContent>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4 text-sm">
          <div className="flex items-center gap-2">
            <img
              alt={providerName}
              className="size-6 rounded-full bg-primary"
              src={`${temp_host}/images/${providerName.toLowerCase()}.${providerName?.toLowerCase()}.png`}
            />

            <div className="font-medium">{providerName}</div>

            <div className="rounded bg-success px-1 py-0.5 text-success-foreground text-xs">Best</div>
          </div>

          <div className="!ml-auto mr-4 flex items-center gap-1 text-muted-foreground text-sm">
            <TimerIcon className="size-4" />

            <span>{formattedEstimatedTime}</span>
          </div>

          <div className="font-medium text-foreground">
            {selectedRoute?.expectedBuyAmount} {buyAsset?.ticker}
          </div>

          <ChevronRight className="ml-2 size-4 text-foreground" />
        </CardHeader>

        <Accordion collapsible type="single">
          <AccordionItem className="-mb-4 -mx-4" value="quote">
            <AccordionTrigger className="flex items-center rounded-b-lg border-card border-r border-b border-l bg-background p-4 text-sm hover:bg-background/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent">
              <ArrowLeftRight className="size-4 text-muted-foreground" />

              <span className="ml-2">
                1 {sellAsset?.ticker} ≈ {selectedRoute?.expectedBuyAmount} {buyAsset?.ticker}
              </span>

              <span className="mr-2 ml-auto font-medium">Fees: $0.161711</span>
            </AccordionTrigger>

            <AccordionContent className="rounded-b-lg border-card border-r border-b border-l bg-background px-4 pb-4 duration-150">
              <ul className="flex flex-col gap-2 text-muted-foreground">
                <li className="flex items-center gap-1">
                  <span>Minimum received after slippage (6.5%)</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">
                    {selectedRoute?.expectedBuyAmountMaxSlippage} {buyAsset?.ticker}
                  </span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Liquidity fee</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">
                    ${selectedRoute?.fees?.find((fee) => fee.type === "liquidity")?.amount || "0.00"}
                  </span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Exchange fee</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-success-foreground">FREE</span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Inbound network fee</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">
                    ${selectedRoute?.fees?.find((fee) => fee.type === "inbound")?.amount || "0.00"}
                  </span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
