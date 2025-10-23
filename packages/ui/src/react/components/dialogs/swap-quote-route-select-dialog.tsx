import { TimerIcon } from "lucide-react";
import { useModal } from "../../hooks/use-modal";
import type { useSwapQuote } from "../../hooks/use-swap-quote";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export const SwapQuoteRouteSelectDialog = ({
  swapQuoteRoutes,
}: {
  swapQuoteRoutes: ReturnType<typeof useSwapQuote>["swapQuote"][];
}) => {
  const modal = useModal();

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select provider</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {swapQuoteRoutes?.map((swapQuoteRoute) => (
            <Button
              className="h-auto w-full justify-start p-4"
              key={`swap-quote-route-${swapQuoteRoute?.providerName}`}
              onClick={() => modal.resolve({ confirmed: true, data: swapQuoteRoute })}>
              {swapQuoteRoute?.providerName && (
                <img
                  alt={swapQuoteRoute?.providerName}
                  className="size-10 rounded-full bg-primary"
                  src={swapQuoteRoute?.providerLogoURI ?? ""}
                />
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base text-foreground">{swapQuoteRoute?.providerName}</span>

                  <div className="rounded bg-success px-1 py-0.5 text-success-foreground text-xs">Best</div>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <TimerIcon className="size-4" />

                  <div className="mt-0.5 font-normal">{swapQuoteRoute?.formattedEstimatedTime}</div>
                </div>
              </div>

              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="font-medium text-base text-foreground">
                  {swapQuoteRoute?.expectedBuyAmount} {swapQuoteRoute?.outputAssetTicker}
                </span>

                <span className="font-normal text-muted-foreground text-xs">
                  ≈ {swapQuoteRoute?.formattedOutputAssetPriceUSD}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
