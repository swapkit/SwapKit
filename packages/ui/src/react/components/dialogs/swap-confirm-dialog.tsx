import { ChevronDown, MoveDownIcon } from "lucide-react";
import { useMemo } from "react";
import { useModal } from "../../hooks/use-modal";
import type { useSwapQuote } from "../../hooks/use-swap-quote";
import { SwapAmountInput } from "../composable/swap-amount-input";
import { SwapAssetItem } from "../composable/swap-asset-item";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export const SwapConfirmDialog = ({
  swapRoute,
}: {
  swapRoute: NonNullable<ReturnType<typeof useSwapQuote>["selectedRoute"]>;
}) => {
  const modal = useModal();

  const { totalFeesListItems, swapSummaryListItems } = useMemo(() => {
    const totalFeesListItems = [
      { title: "Network fee", value: swapRoute.formattedInboundNetworkFeeUSD },
      { title: "Liquidity fee", value: swapRoute.formattedLiquidityFeeUSD },
      { title: "Exchange fee", value: swapRoute.formattedExchangeFeeUSD },
    ];

    const swapSummaryListItems = [
      { title: "Estimated time", value: swapRoute.formattedEstimatedTime },
      { title: "Max. slippage", value: swapRoute?.formattedMaxSlippagePercentage },
      { title: "Recipient", value: swapRoute.route?.destinationAddress },
      { title: "Min received", value: `${swapRoute.expectedBuyAmountMaxSlippage} ${swapRoute.route?.buyAsset}` },
    ];

    return { swapSummaryListItems, totalFeesListItems };
  }, [swapRoute]);

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm swap</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SwapAssetItem asset={swapRoute?.route?.sellAsset} />

            <SwapAmountInput
              amount={swapRoute.amount}
              className="[&_input]:!opacity-100 [&_input]:!cursor-text"
              disabled
              formattedAmountUSD={swapRoute.formattedInputAssetPriceUSD}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px w-full bg-border" />

            <MoveDownIcon className="size-4 shrink-0 stroke-[2.5] font-bold text-[#8b8c8b]" />

            <div className="h-px w-full bg-border" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <SwapAssetItem asset={swapRoute?.route?.buyAsset} />

            <SwapAmountInput
              amount={swapRoute?.expectedBuyAmount?.toString()}
              className="[&_input]:!opacity-100 [&_input]:!cursor-text"
              disabled
              formattedAmountUSD={swapRoute?.formattedOutputAssetPriceUSD}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border p-4 text-sm">
          <Accordion type="multiple">
            <AccordionItem value="total-fee">
              <AccordionTrigger
                className="-mx-4 -mt-4 -mb-3 items-center px-4 py-3 text-muted-foreground outline-none duration-150 hover:text-foreground hover:no-underline focus:text-foreground"
                showChevron={false}>
                <span className="flex items-center">Total fee</span>

                <ChevronDown className="mt-px ml-1 size-4" />

                <span className="ml-auto font-medium text-foreground">{swapRoute?.formattedTotalFeesUSD}</span>
              </AccordionTrigger>

              <AccordionContent className="mt-3 pb-0">
                <ul className="flex flex-col gap-3 border-b pb-3">
                  {totalFeesListItems.map((item) => (
                    <li className="flex items-start justify-between gap-1" key={`total-fee-list-item-${item.title}`}>
                      <span className="text-muted-foreground">{item.title}</span>

                      <span className="max-w-[60%] break-all text-right font-medium">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>

              <ul className="mt-3 flex flex-col gap-3">
                {swapSummaryListItems.map((item) => (
                  <li className="flex items-start justify-between gap-1" key={`swap-list-item-${item.title}`}>
                    <span className="text-muted-foreground">{item.title}</span>

                    <span className="max-w-[60%] break-all text-right font-medium">{item.value}</span>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          </Accordion>
        </div>

        <Button onClick={() => modal.resolve({ confirmed: true, data: undefined })} variant="primary">
          Confirm swap
        </Button>
      </DialogContent>
    </Dialog>
  );
};
