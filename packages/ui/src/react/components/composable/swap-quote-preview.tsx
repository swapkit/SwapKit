"use client";

import { ArrowLeftRight, ChevronRight, InfoIcon, TimerIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Card, CardContent, CardHeader } from "../ui/card";

export function SwapQuotePreview({ className }: { className?: string }) {
  return (
    <Card className={className}>
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

        <Accordion collapsible type="single">
          <AccordionItem className="-mb-4 -mx-4" value="quote">
            <AccordionTrigger className="flex items-center rounded-b-lg border-card border-r border-b border-l bg-background p-4 text-sm hover:bg-background/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent">
              <ArrowLeftRight className="size-4 text-muted-foreground" />

              <span className="ml-2">1 USDT ≈ 0.00052448 ETH</span>

              <span className="mr-2 ml-auto font-medium">Fees: $0.161711</span>
            </AccordionTrigger>

            <AccordionContent className="rounded-b-lg border-card border-r border-b border-l bg-background px-4 pb-4 duration-150">
              <ul className="flex flex-col gap-2 text-muted-foreground">
                <li className="flex items-center gap-1">
                  <span>Minimum received after slippage (6.5%)</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">00.00 USDT</span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Liquidity fee</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">$0.00</span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Exchange fee</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-success-foreground">FREE</span>
                </li>

                <li className="flex items-center gap-1">
                  <span>Inbound network fee</span>

                  <InfoIcon className="size-4" />

                  <span className="ml-auto font-medium text-foreground">$0,161711</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
