import { AssetValue, type Chain, getChainConfig } from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";

const pid = typeof process !== "undefined" && process.pid ? process.pid.toString(36) : "";

let last = 0;
export function uniqid() {
  function now() {
    const time = Date.now();
    const lastTime = last || time;
    last = lastTime;

    return time > last ? time : lastTime + 1;
  }

  return pid + now().toString(36);
}

export function getBalance<T extends Chain>(chain: T) {
  return async function getBalance(address: string, scamFilter = true) {
    const balances = await SwapKitApi.getChainBalance({ address, chain, scamFilter });
    const { baseDecimal } = getChainConfig(chain);
    return balances.map(({ identifier, value, decimal }) => {
      return new AssetValue({ decimal: decimal || baseDecimal, identifier, value });
    });
  };
}
