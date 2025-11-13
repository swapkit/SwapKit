"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

interface TruncatedAddressProps {
  address: string;
  className?: string;
}

export function TruncatedAddress({ address, className }: TruncatedAddressProps) {
  const [isCopied, setIsCopied] = useState(false);

  const truncated = `${address.slice(0, 5)}...${address.slice(-5)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  return (
    <Button
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground",
        className,
      )}
      onClick={handleCopy}>
      <span className="font-mono">{truncated}</span>
      <Copy className={`h-3 w-3 ${isCopied ? "text-green-500" : ""}`} />
    </Button>
  );
}
