import { Chain, FeeOption } from "@swapkit/helpers";
import { networks } from "bitcoinjs-lib";
// @ts-ignore TODO: check why wallets doesn't see modules included in toolbox
import coininfo from "coininfo";

const pid = typeof process !== "undefined" && process.pid ? process.pid.toString(36) : "";

export const getNetwork = (chain: Chain) => {
  switch (chain) {
    case Chain.Bitcoin:
      return networks.bitcoin;
    case Chain.BitcoinCash:
      return coininfo.bitcoincash.main.toBitcoinJS();
    case Chain.Dash:
      return coininfo.dash.main.toBitcoinJS();
    case Chain.Litecoin:
      return coininfo.litecoin.main.toBitcoinJS();

    case Chain.Dogecoin: {
      const bip32 = { private: 0x04358394, public: 0x043587cf };
      const test = coininfo.dogecoin.test;
      test.versions.bip32 = bip32;
      return coininfo.dogecoin.main.toBitcoinJS();
    }
    default:
      throw new Error("Invalid chain");
  }
};

export const standardFeeRates = (rate: number) => ({
  [FeeOption.Average]: rate,
  [FeeOption.Fast]: rate * 1.5,
  [FeeOption.Fastest]: rate * 2.0,
});

let last = 0;
const now = () => {
  const time = Date.now();
  const lastTime = last || time;
  last = lastTime;

  return time > last ? time : lastTime + 1;
};

export const uniqid = () => pid + now().toString(36);
