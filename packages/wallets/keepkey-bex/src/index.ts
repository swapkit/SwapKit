import type { Eip1193Provider } from "ethers";

export { keepkeyBexWallet } from "./keepkeyWallet";

declare global {
  interface Window {
    keepkey?: {
      binance: Eip1193Provider;
      bitcoin: Eip1193Provider;
      bitcoincash: Eip1193Provider;
      dogecoin: Eip1193Provider;
      ethereum: Eip1193Provider;
      cosmos: Eip1193Provider;
      dash: Eip1193Provider;
      litecoin: Eip1193Provider;
      thorchain: Eip1193Provider;
      mayachain: Eip1193Provider;
    };
  }
}
