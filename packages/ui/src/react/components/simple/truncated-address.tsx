"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { Button } from "../ui/button";

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
    <div className={cn("sk-ui-flex sk-ui-items-center sk-ui-gap-1", className)}>
      <span className="sk-ui-font-mono sk-ui-text-sm">{truncated}</span>

      <Button className="sk-ui-size-7 sk-ui-p-0" onClick={handleCopy} variant="ghost">
        <Copy className={cn("sk-ui-size-4", isCopied && "sk-ui-text-green-500")} />
      </Button>
    </div>
  );
}
