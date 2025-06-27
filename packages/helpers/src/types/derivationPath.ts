import { derivationPathToString } from "../utils/derivationPath";
import type { Chain } from "./chains";

export enum ContractAddress {
  ARB = "0x0000000000000000000000000000000000000000",
  AVAX = "0x0000000000000000000000000000000000000000",
  BASE = "0x0000000000000000000000000000000000000000",
  ETH = "0x0000000000000000000000000000000000000000",
  BSC = "0x0000000000000000000000000000000000000000",
  MATIC = "0x0000000000000000000000000000000000001010",
  OP = "0x4200000000000000000000000000000000000042",
}

export type DerivationPathArray = [number, number, number, number, number?];

export const NetworkDerivationPath: Record<Chain, DerivationPathArray> = {
  ARB: [44, 60, 0, 0, 0],
  AVAX: [44, 60, 0, 0, 0],
  BASE: [44, 60, 0, 0, 0],
  BCH: [44, 145, 0, 0, 0],
  BSC: [44, 60, 0, 0, 0],
  BTC: [84, 0, 0, 0, 0],
  DASH: [44, 5, 0, 0, 0],
  DOGE: [44, 3, 0, 0, 0],
  ETH: [44, 60, 0, 0, 0],
  GAIA: [44, 118, 0, 0, 0],
  KUJI: [44, 118, 0, 0, 0],
  LTC: [84, 2, 0, 0, 0],
  MATIC: [44, 60, 0, 0, 0],
  MAYA: [44, 931, 0, 0, 0],
  NEAR: [44, 397, 0, 0, 0],
  OP: [44, 60, 0, 0, 0],
  SOL: [44, 501, 0, 0, 0],
  THOR: [44, 931, 0, 0, 0],

  // Polkadot and related network derivation path is not number based
  DOT: [0, 0, 0, 0, 0],
  FIAT: [0, 0, 0, 0, 0],
  FLIP: [0, 0, 0, 0, 0],
  XRD: [0, 0, 0, 0, 0],
  XRP: [44, 144, 0, 0, 0],
};

export const DerivationPath: Record<Chain, string> = Object.keys(NetworkDerivationPath).reduce(
  (acc, key) => {
    acc[key as Chain] = derivationPathToString(NetworkDerivationPath[key as Chain]);
    return acc;
  },
  {} as Record<Chain, string>,
);
