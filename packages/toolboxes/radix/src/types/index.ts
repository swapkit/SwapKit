import { Chain } from "@swapkit/helpers";
import type { RadixToolbox } from "../index";

export type RadixWallets = {
  [Chain.Radix]: Awaited<ReturnType<typeof RadixToolbox>>;
};
