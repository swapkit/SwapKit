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
      <CardContent className="sk-ui-fade-in-0 sk-ui-flex sk-ui-animate-in sk-ui-flex-col sk-ui-items-stretch sk-ui-duration-300">
        <Button
          className="sk-ui--mt-4 sk-ui--mx-4 sk-ui-flex sk-ui-rounded-t-xl sk-ui-rounded-b-none sk-ui-px-4 sk-ui-py-3 hover:sk-ui-bg-white/[0.08]"
          onClick={selectQuoteRoute}
          variant="unstyled">
          <CardHeader className="sk-ui-flex sk-ui-w-full sk-ui-flex-row sk-ui-items-center sk-ui-space-y-0 sk-ui-text-sm">
            <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
              {selectedRoute?.providerName && (
                <img
                  alt={selectedRoute?.providerName}
                  className="sk-ui-size-6 sk-ui-rounded-full sk-ui-bg-primary"
                  src={selectedRoute?.providerLogoURI ?? ""}
                />
              )}

              <div className="sk-ui-font-medium">{selectedRoute?.providerName}</div>

              {selectedRouteHasTags && (
                <div className="sk-ui-rounded sk-ui-bg-success sk-ui-px-1 sk-ui-py-0.5 sk-ui-text-success-foreground sk-ui-text-xs">
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

            <div className="!sk-ui-ml-auto sk-ui-mr-4 sk-ui-flex sk-ui-items-center sk-ui-gap-1 sk-ui-text-muted-foreground sk-ui-text-sm">
              <TimerIcon className="sk-ui-size-4" />

              <span className="sk-ui-font-normal">{selectedRoute?.formattedEstimatedTime}</span>
            </div>

            <div className="sk-ui-font-medium sk-ui-text-foreground">
              {selectedRoute?.expectedBuyAmount} {selectedRoute?.outputAssetTicker}
            </div>

            <ChevronRight className="sk-ui-ml-2 sk-ui-size-4 sk-ui-text-foreground" />
          </CardHeader>
        </Button>

        <Accordion collapsible type="single">
          <AccordionItem className="sk-ui--mb-4 sk-ui--mx-4" value="quote">
            <AccordionTrigger className="sk-ui-flex sk-ui-items-center sk-ui-rounded-b-lg sk-ui-border-card sk-ui-border-r sk-ui-border-b sk-ui-border-l sk-ui-bg-background sk-ui-p-4 sk-ui-text-sm hover:sk-ui-bg-background/50 hover:sk-ui-no-underline data-[state=open]:sk-ui-rounded-b-none data-[state=open]:sk-ui-border-b-transparent">
              <ArrowLeftRight className="sk-ui-size-4 sk-ui-text-muted-foreground" />

              <span className="sk-ui-ml-2">
                1 {selectedRoute?.inputAssetTicker} ≈ {selectedRoute?.expectedBuyAmountFor1Input.toFixed(6)}{" "}
                {selectedRoute?.outputAssetTicker}
              </span>

              <span className="sk-ui-mr-2 sk-ui-ml-auto sk-ui-font-medium">
                Fees: {selectedRoute?.formattedTotalFeesUSD}
              </span>
            </AccordionTrigger>

            <AccordionContent className="sk-ui-rounded-b-lg sk-ui-border-card sk-ui-border-r sk-ui-border-b sk-ui-border-l sk-ui-bg-background sk-ui-px-4 sk-ui-pb-4 sk-ui-duration-150">
              <ul className="sk-ui-flex sk-ui-flex-col sk-ui-gap-2 sk-ui-text-muted-foreground">
                <li className="sk-ui-flex sk-ui-items-center sk-ui-gap-1">
                  <span>Minimum received after slippage ({selectedRoute?.formattedMaxSlippagePercentage})</span>

                  <InfoIcon className="sk-ui-size-4" />

                  <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-foreground">
                    {selectedRoute?.expectedBuyAmountMaxSlippage} {selectedRoute?.outputAssetTicker}
                  </span>
                </li>

                <li className="sk-ui-flex sk-ui-items-center sk-ui-gap-1">
                  <span>Liquidity fee</span>

                  <InfoIcon className="sk-ui-size-4" />

                  {selectedRoute?.formattedLiquidityFeeUSD === "$0.00" ? (
                    <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-success-foreground">FREE</span>
                  ) : (
                    <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-foreground">
                      {selectedRoute?.formattedLiquidityFeeUSD}
                    </span>
                  )}
                </li>

                <li className="sk-ui-flex sk-ui-items-center sk-ui-gap-1">
                  <span>Exchange fee</span>

                  <InfoIcon className="sk-ui-size-4" />

                  {selectedRoute?.formattedExchangeFeeUSD === "$0.00" ? (
                    <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-success-foreground">FREE</span>
                  ) : (
                    <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-foreground">
                      {selectedRoute?.formattedExchangeFeeUSD}
                    </span>
                  )}
                </li>

                <li className="sk-ui-flex sk-ui-items-center sk-ui-gap-1">
                  <span>Inbound network fee</span>

                  <InfoIcon className="sk-ui-size-4" />

                  {selectedRoute?.formattedInboundNetworkFeeUSD === "$0.00" ? (
                    <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-success-foreground">FREE</span>
                  ) : (
                    <span className="sk-ui-ml-auto sk-ui-font-medium sk-ui-text-foreground">
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
