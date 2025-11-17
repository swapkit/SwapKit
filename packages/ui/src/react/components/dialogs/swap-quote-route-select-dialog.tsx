import { PriorityLabel } from "@swapkit/sdk";
import { TimerIcon } from "lucide-react";
import { match } from "ts-pattern";
import { cn } from "../../../lib/utils";
import { useModal } from "../../hooks/use-modal";
import type { UseSwapQuoteReturn } from "../../hooks/use-swap-quote";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export const SwapQuoteRouteSelectDialog = ({
  routes,
  selectedRoute,
}: {
  routes: UseSwapQuoteReturn["routes"];
  selectedRoute: UseSwapQuoteReturn["selectedRoute"];
}) => {
  const modal = useModal<NonNullable<UseSwapQuoteReturn["selectedRoute"]>["routeIndex"]>();

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select provider</DialogTitle>
        </DialogHeader>

        <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-2">
          {routes?.map((route) => (
            <Button
              className={cn(
                "sk-ui-h-auto sk-ui-w-full sk-ui-justify-start sk-ui-p-4",
                route?.routeIndex === selectedRoute?.routeIndex && "sk-ui-ring-2 sk-ui-ring-white/[0.64]",
              )}
              key={`swap-quote-route-${route?.providerName}`}
              onClick={() => modal.resolve({ confirmed: true, data: route?.routeIndex })}>
              {route?.providerName && (
                <img
                  alt={route?.providerName}
                  className="sk-ui-size-10 sk-ui-rounded-full sk-ui-bg-primary"
                  src={route?.providerLogoURI ?? ""}
                />
              )}

              <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-1">
                <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
                  <span className="sk-ui-font-medium sk-ui-text-base sk-ui-text-foreground">{route?.providerName}</span>

                  {route?.tags?.length > 0 && (
                    <div className="sk-ui-rounded sk-ui-bg-success sk-ui-px-1 sk-ui-py-0.5 sk-ui-text-success-foreground sk-ui-text-xs">
                      {match(route?.tags)
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
                        .otherwise((tags) => tags?.[0] ?? null)}
                    </div>
                  )}
                </div>

                <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-1 sk-ui-text-muted-foreground sk-ui-text-xs">
                  <TimerIcon className="sk-ui-size-4" />

                  <div className="sk-ui-mt-0.5 sk-ui-font-normal">{route?.formattedEstimatedTime}</div>
                </div>
              </div>

              <div className="sk-ui-ml-auto sk-ui-flex sk-ui-flex-col sk-ui-items-end sk-ui-gap-1">
                <span className="sk-ui-font-medium sk-ui-text-base sk-ui-text-foreground">
                  {route?.expectedBuyAmount?.toFixed(6)} {route?.outputAssetTicker}
                </span>

                <span className="sk-ui-font-normal sk-ui-text-muted-foreground sk-ui-text-xs">
                  ≈ {route?.formattedOutputAssetPriceUSD}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
