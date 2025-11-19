import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import tailwindConfig from "../tailwind.config";

const twMergeWithPrefix = extendTailwindMerge({ prefix: tailwindConfig.prefix });

export function cn(...inputs: ClassValue[]) {
  return twMergeWithPrefix(clsx(inputs));
}

export function formatCurrency(amount: number | null) {
  return Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amount ?? 0);
}
