"use client";

import { SwapKitWidget } from "@swapkit/ui/react";

import "@swapkit/ui/swapkit.css";

export default function SwapPage() {
  return <SwapKitWidget apiKey={process.env.NEXT_PUBLIC_TEST_API_KEY || ""} />;
}
