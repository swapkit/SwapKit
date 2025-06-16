import {
  Chain,
  type DerivationPathArray,
  type EVMChain,
  EVMChains,
  NetworkDerivationPath,
} from "../types";

type Params = {
  chain: Chain;
  index: number;
  addressIndex?: number;
  type?: "legacy" | "ledgerLive" | "nativeSegwitMiddleAccount" | "segwit" | "account";
};

export function updateDerivationPath(
  path: DerivationPathArray,
  params: { index: number } | { account: number } | { change: number },
) {
  if ("index" in params) {
    const newPath = [...path.slice(0, path.length - 1), params.index];
    return newPath as DerivationPathArray;
  }

  if ("change" in params) {
    const [network, chainId, account, , index] = path;
    return [network, chainId, account, params.change, index] as DerivationPathArray;
  }

  if ("account" in params) {
    const [network, chainId, , change, index] = path;
    return [network, chainId, params.account, change, index] as DerivationPathArray;
  }

  return path;
}

export function derivationPathToString([network, chainId, account, change, index]:
  | [number, number, number, number?, number?]
  | [number, number, number, number, number?]
  | DerivationPathArray) {
  const shortPath = typeof index !== "number";
  const accountPath = typeof change !== "number";

  if (accountPath) {
    return `m/${network}'/${chainId}'/${account}'`;
  }

  return `m/${network}'/${chainId}'/${account}'/${change}${shortPath ? "" : `/${index}`}`;
}

// TODO @towan - sort this out and make it more readable
export function getDerivationPathFor({ chain, index, addressIndex = 0, type }: Params) {
  if (EVMChains.includes(chain as EVMChain)) {
    if (type && ["legacy", "account"].includes(type)) {
      return [44, 60, 0, index] as DerivationPathArray;
    }

    if (type === "ledgerLive") {
      return [44, 60, index, 0, addressIndex] as DerivationPathArray;
    }

    return updateDerivationPath(NetworkDerivationPath[chain], { index });
  }

  if (chain === Chain.Solana) {
    if (type === "account") return [44, 501, 0, index] as DerivationPathArray;
    return updateDerivationPath(NetworkDerivationPath[chain], { index });
  }

  const chainId = chain === Chain.Litecoin ? 2 : 0;

  switch (type) {
    case "nativeSegwitMiddleAccount":
      return [84, chainId, index, 0, addressIndex] as DerivationPathArray;
    case "segwit":
      return [49, chainId, 0, 0, index] as DerivationPathArray;
    case "legacy":
      return [44, chainId, 0, 0, index] as DerivationPathArray;
    default:
      return updateDerivationPath(NetworkDerivationPath[chain], { index });
  }
}

export function getWalletFormatFor(path: string) {
  const [_, purpose, chainId] = path.split("/").map((p) => Number.parseInt(p, 10));

  if (chainId === 145) "cashaddr";

  switch (purpose) {
    case 44:
      return "legacy";
    case 49:
      return "p2sh";
    default:
      return "bech32";
  }
}
