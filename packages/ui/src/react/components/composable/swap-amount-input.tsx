import { Loader2Icon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Input } from "../ui/input";

export function SwapAmountInput({
  amount,
  setAmount,
  isLoading,
  formattedAmountUSD,
  disabled = false,
  className,
}: {
  amount: string | null | undefined;
  formattedAmountUSD: string | undefined;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  setAmount?: (amount: string) => void;
}) {
  return (
    <div className={cn("sk-ui-flex sk-ui-flex-col sk-ui-items-end", className)}>
      <Input
        className="sk-ui--mr-3 !sk-ui-shadow-none !sk-ui-border-0 !sk-ui-ring-0 !sk-ui-ring-offset-0 sk-ui-bg-transparent sk-ui-text-end sk-ui-font-medium sk-ui-text-2xl"
        disabled={disabled}
        onChange={(e) => setAmount?.(e.target.value)}
        placeholder="0.00"
        type="text"
        value={amount ?? "0.00"}
      />

      <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-1">
        {isLoading && <Loader2Icon className="sk-ui-size-3.5 sk-ui-animate-spin" />}

        <span className="sk-ui-text-muted-foreground sk-ui-text-sm">{formattedAmountUSD}</span>
      </div>
    </div>
  );
}
