import { ChevronDown } from "lucide-react";
import { useModal } from "../../hooks/use-modal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const totalFeesListItems = [
  { title: "Network fee", value: "$0.02" },
  { title: "Liquidity fee", value: "$0.02" },
  { title: "Exchange fee", value: "$0.02" },
];

const swapListItems = [
  { title: "Estimated time", value: "<10m" },
  { title: "Max. slippage", value: "3.00%" },
  { title: "Recipient", value: "0x1234567890123456789012345678901234567890" },
  { title: "Min received", value: "0,161711 USDT" },
];
export const SwapConfirmDialog = () => {
  const modal = useModal();

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm swap</DialogTitle>
        </DialogHeader>

        <div>
          <div>ETH</div>
          <div>
            <div>1</div>
            <ChevronDown />
            <div>1</div>
          </div>
          <div>BTC</div>
        </div>

        <div className="overflow-hidden rounded-lg border p-4 text-sm">
          <Accordion type="multiple">
            <AccordionItem value="total-fee">
              <AccordionTrigger
                className="-mx-4 -mt-4 -mb-3 items-center px-4 py-3 text-muted-foreground outline-none duration-150 hover:text-foreground hover:no-underline focus:text-foreground"
                showChevron={false}>
                <span className="flex items-center">Total fee</span>

                <ChevronDown className="mt-px ml-1 size-4" />

                <span className="ml-auto font-medium text-foreground">$0.02</span>
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
                {swapListItems.map((item) => (
                  <li className="flex items-start justify-between gap-1" key={`swap-list-item-${item.title}`}>
                    <span className="text-muted-foreground">{item.title}</span>

                    <span className="max-w-[60%] break-all text-right font-medium">{item.value}</span>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          </Accordion>
        </div>

        <Button variant="primary">Confirm swap</Button>
      </DialogContent>
    </Dialog>
  );
};
