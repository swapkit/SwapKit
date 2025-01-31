export { vultisigWallet, VULTISIG_SUPPORTED_CHAINS } from "./vultisigWallet";

type RequestArguments = {
  method: string;
  params?: Record<string, any>[];
};

interface BaseProvider {
  isVultiConnect: boolean;
  request(args: RequestArguments): Promise<string | string[]>;
  on(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback: Function): void;
  _emit(event: string, data: any): void;
  connect(): void;
  disconnect(error?: { code: number; message: string }): void;
  addListener(event: string, callback: (data: any) => void): void;
}

export interface VultisigProvider extends BaseProvider {
  isMetaMask: boolean;
  networkVersion: string;
  enable(): Promise<string[]>;
  isConnected(): boolean;
  _events: Record<string, Function[]>;
}

declare global {
  interface Window {
    vultisig?: {
      binance: VultisigProvider;
      bitcoin: VultisigProvider;
      bitcoincash: VultisigProvider;
      dogecoin: VultisigProvider;
      ethereum: VultisigProvider;
      litecoin: VultisigProvider;
      thorchain: VultisigProvider;
      maya: VultisigProvider;
      cosmos: VultisigProvider;
      kujira: VultisigProvider;
      dash: VultisigProvider;
    };
  }
}
