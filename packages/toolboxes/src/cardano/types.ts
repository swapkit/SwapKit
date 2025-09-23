import type { getCardanoToolbox } from "./toolbox";

export type CardanoWallet = Awaited<ReturnType<typeof getCardanoToolbox>>;

export interface CardanoProvider {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  address: string | null;
  signTransaction: (transaction: any) => Promise<any>;
}
