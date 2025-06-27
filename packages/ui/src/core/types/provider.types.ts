import type { Chain } from "@swapkit/core";

export interface ProviderState {
  id: string;
  name: string;
  icon?: string;
  chains: Chain[];
  enabled: boolean;
}
