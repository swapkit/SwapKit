"use client";

import { PriorityLabel } from "@swapkit/sdk";
import { ArrowLeftRight, ChevronRight, InfoIcon, TimerIcon } from "lucide-react";
import { match } from "ts-pattern";
import { showModal } from "../../hooks/use-modal";
import type { UseSwapQuoteReturn } from "../../hooks/use-swap-quote";
import { SwapQuoteRouteSelectDialog } from "../dialogs/swap-quote-route-select-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";

export function SwapQuotePreview({
  selectedRoute,
  routes,
  setSelectedRouteIndex,
  className,
}: {
  selectedRoute: UseSwapQuoteReturn["selectedRoute"];
  routes: UseSwapQuoteReturn["routes"];
  setSelectedRouteIndex: UseSwapQuoteReturn["setSelectedRouteIndex"];
  className?: string;
}) {
  if (!selectedRoute) return null;

  const selectQuoteRoute = async () => {
    const { confirmed, data: selectedRouteIndex } = await showModal<number>(
      <SwapQuoteRouteSelectDialog routes={routes} selectedRoute={selectedRoute} />,
    );

    if (!confirmed) return;

    setSelectedRouteIndex(selectedRouteIndex);
  };

  const selectedRouteHasTags = selectedRoute?.tags && selectedRoute?.tags?.length > 0;

  return (
    <Card className={className}>
      <CardContent className="fade-in-0 flex animate-in flex-col items-stretch duration-300">
        <Button
          className="-mt-4 -mx-4 flex rounded-t-xl rounded-b-none px-4 py-3 hover:bg-white/[0.08]"
          onClick={selectQuoteRoute}
          variant="unstyled">
          <CardHeader className="flex w-full flex-row items-center space-y-0 text-sm">
            <div className="flex items-center gap-2">
              {selectedRoute?.providerName && (
                <img
                  alt={selectedRoute?.providerName}
                  className="size-6 rounded-full bg-primary"
                  src={selectedRoute?.providerLogoURI ?? ""}
                />
              )}

              <div className="font-medium">{selectedRoute?.providerName}</div>

              {selectedRouteHasTags && (
                <div className="rounded bg-success px-1 py-0.5 text-success-foreground text-xs">
                  {match(selectedRoute?.tags)
                    .when(
                      (tags) => tags?.includes(PriorityLabel.RECOMMENDED),
                      () => "Best",
                    )
                    .when(
                      (tags) => tags?.includes(PriorityLabel.CHEAPEST),
                      () => "Cheapest",
                    )
                    .when(
                      (tags) => tags?.includes(PriorityLabel.FASTEST),
                      () => "Fastest",
                    )
                    .otherwise(() => null)}
                </div>
              )}
            </div>

            <div className="!ml-auto mr-4 flex items-center gap-1 text-muted-foreground text-sm">
              <TimerIcon className="size-4" />

              <span className="font-normal">{selectedRoute?.formattedEstimatedTime}</span>
            </div>

            <div className="font-medium text-foreground">
              {selectedRoute?.expectedBuyAmount} {selectedRoute?.outputAssetTicker}
            </div>

            <ChevronRight className="ml-2 size-4 text-foreground" />
          </CardHeader>
        </Button>

        <Accordion collapsible type="single">
          <AccordionItem className="-mb-4 -mx-4" value="quote">
            <AccordionTrigger className="flex items-center rounded-b-lg border-card border-r border-b border-l bg-background p-4 text-sm hover:bg-background/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent">
              <ArrowLeftRight className="size-4 text-muted-foreground" />

              <span className="ml-2">
                1 {selectedRoute?.inputAssetTicker} ≈ {selectedRoute?.expectedBuyAmountFor1Input.toFixed(6)}{" "}
                {selectedRoute?.outputAssetTicker}
              </span>

              <span className="mr-2 ml-auto font-medium">Fees: {selectedRoute?.formattedTotalFeesUSD}</span>
            </AccordionTrigger>

            <AccordionContent className="rounded-b-lg border-card border-r border-b border-l bg-background px-4 pb-4 duration-150">
              <ul className="flex flex-col gap-2 text-muted-foreground">
                <li className="flex items-center gap-1">
                  <span>Minimum received after slippage (6.5%)</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">
                    {selectedRoute?.expectedBuyAmountMaxSlippage} {selectedRoute?.outputAssetTicker}
                  </span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Liquidity fee</span>

                  <InfoIcon className="size-4" />

                  {selectedRoute?.formattedLiquidityFeeUSD === "$0.00" ? (
                    <span className="ml-auto font-medium text-success-foreground">FREE</span>
                  ) : (
                    <span className="ml-auto font-medium text-foreground">
                      {selectedRoute?.formattedLiquidityFeeUSD}
                    </span>
                  )}
                </li>

                <li className="flex items-center gap-1">
                  <span>Exchange fee</span>

                  <InfoIcon className="size-4" />

                  {selectedRoute?.formattedExchangeFeeUSD === "$0.00" ? (
                    <span className="ml-auto font-medium text-success-foreground">FREE</span>
                  ) : (
                    <span className="ml-auto font-medium text-foreground">
                      {selectedRoute?.formattedExchangeFeeUSD}
                    </span>
                  )}
                </li>

                <li className="flex items-center gap-1">
                  <span>Inbound network fee</span>

                  <InfoIcon className="size-4" />

                  {selectedRoute?.formattedInboundNetworkFeeUSD === "$0.00" ? (
                    <span className="ml-auto font-medium text-success-foreground">FREE</span>
                  ) : (
                    <span className="ml-auto font-medium text-foreground">
                      {selectedRoute?.formattedInboundNetworkFeeUSD}
                    </span>
                  )}
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
