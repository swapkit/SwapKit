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

        <div className="flex flex-col gap-2">
          {routes?.map((route) => (
            <Button
              className={cn(
                "h-auto w-full justify-start p-4",
                route?.routeIndex === selectedRoute?.routeIndex && "ring-2 ring-white/[0.64]",
              )}
              key={`swap-quote-route-${route?.providerName}`}
              onClick={() => modal.resolve({ confirmed: true, data: route?.routeIndex })}>
              {route?.providerName && (
                <img
                  alt={route?.providerName}
                  className="size-10 rounded-full bg-primary"
                  src={route?.providerLogoURI ?? ""}
                />
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base text-foreground">{route?.providerName}</span>

                  {route?.tags?.length > 0 && (
                    <div className="rounded bg-success px-1 py-0.5 text-success-foreground text-xs">
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

                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <TimerIcon className="size-4" />

                  <div className="mt-0.5 font-normal">{route?.formattedEstimatedTime}</div>
                </div>
              </div>

              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="font-medium text-base text-foreground">
                  {route?.expectedBuyAmount?.toFixed(6)} {route?.outputAssetTicker}
                </span>

                <span className="font-normal text-muted-foreground text-xs">
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
