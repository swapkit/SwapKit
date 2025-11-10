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
    <div className={cn("flex flex-col items-end", className)}>
      <Input
        className="-mr-3 !shadow-none !border-0 !ring-0 !ring-offset-0 bg-transparent text-end font-medium text-2xl"
        disabled={disabled}
        onChange={(e) => setAmount?.(e.target.value)}
        placeholder="0.00"
        type="text"
        value={amount ?? "0.00"}
      />

      <div className="flex items-center gap-1">
        {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}

        <span className="text-muted-foreground text-sm">{formattedAmountUSD}</span>
      </div>
    </div>
  );
}
