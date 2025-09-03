import type { Keplr } from "@keplr-wallet/types";
import {
  type AssetValue,
  Chain,
  ChainToChainId,
  type EVMChain,
  EVMChains,
  type FeeOption,
  providerRequest,
  SwapKitError,
  WalletOption,
} from "@swapkit/helpers";
import type { SolanaProvider } from "@swapkit/toolboxes/solana";
import type { Eip1193Provider } from "ethers";

type TransactionMethod = "transfer" | "deposit";

type TransactionParams = {
  asset: string | { chain: string; symbol: string; ticker: string };
  amount: number | string | { amount: number; decimals?: number };
  decimal?: number;
  recipient: string;
  memo?: string;
};

export type WalletTxParams = {
  feeOptionKey?: FeeOption;
  from?: string;
  memo?: string;
  recipient: string;
  assetValue: AssetValue;
  gasLimit?: string | bigint;
};

export async function getCtrlProvider<T extends Chain>(
  chain: T,
): Promise<
  T extends Chain.Solana
    ? SolanaProvider
    : T extends Chain.Cosmos | Chain.Kujira | Chain.Noble
      ? Keplr
      : T extends EVMChain
        ? Eip1193Provider
        : undefined
> {
  if (!window.xfi) throw new SwapKitError("wallet_ctrl_not_found");
  const { match } = await import("ts-pattern");

  // @ts-expect-error
  return match(chain as Chain)
    .with(
      Chain.Arbitrum,
      Chain.Aurora,
      Chain.Avalanche,
      Chain.Base,
      Chain.Berachain,
      Chain.BinanceSmartChain,
      Chain.Ethereum,
      Chain.Gnosis,
      Chain.Optimism,
      Chain.Polygon,
      () => window.xfi?.ethereum,
    )
    .with(Chain.Cosmos, Chain.Kujira, Chain.Noble, () => window.xfi?.keplr)
    .with(Chain.Bitcoin, () => window.xfi?.bitcoin)
    .with(Chain.BitcoinCash, () => window.xfi?.bitcoincash)
    .with(Chain.Dogecoin, () => window.xfi?.dogecoin)
    .with(Chain.Litecoin, () => window.xfi?.litecoin)
    .with(Chain.Solana, () => window.xfi?.solana)
    .with(Chain.THORChain, () => window.xfi?.thorchain)
    .with(Chain.Maya, () => window.xfi?.mayachain)
    .otherwise(() => undefined);
}

async function transaction({
  method,
  params,
  chain,
}: {
  method: TransactionMethod;
  params: TransactionParams[];
  chain: Chain;
}): Promise<string> {
  const client = await getCtrlProvider(chain);

  return new Promise<string>((resolve, reject) => {
    if (client && "request" in client) {
      // @ts-expect-error
      client.request({ method, params }, (err: string, tx: string) => {
        err ? reject(err) : resolve(tx);
      });
    }
  });
}

export async function getCtrlAddress(chain: Chain) {
  try {
    const eipProvider = (await getCtrlProvider(chain)) as Eip1193Provider;
    if (!eipProvider) {
      throw new SwapKitError({ errorKey: "wallet_provider_not_found", info: { chain, wallet: WalletOption.CTRL } });
    }

    if ([Chain.Cosmos, Chain.Kujira, Chain.Noble].includes(chain)) {
      const provider = await getCtrlProvider(Chain.Cosmos);
      if (!provider || "request" in provider) {
        throw new SwapKitError({ errorKey: "wallet_provider_not_found", info: { chain, wallet: WalletOption.CTRL } });
      }

      // Enabling before using the Keplr is recommended.
      // This method will ask the user whether to allow access if they haven't visited this website.
      // Also, it will request that the user unlock the wallet if the wallet is locked.
      const chainId = ChainToChainId[chain];
      await provider.enable(chainId);

      const offlineSigner = provider.getOfflineSigner(chainId);

      const [item] = await offlineSigner.getAccounts();
      return item?.address;
    }

    if (EVMChains.includes(chain as EVMChain)) {
      // For CTRL wallet, we need to use the request method directly on the provider
      if ("request" in eipProvider && typeof eipProvider.request === "function") {
        const accounts = await eipProvider.request({ method: "eth_requestAccounts" });
        return accounts[0];
      }
      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(eipProvider, "any");
      const [response] = await providerRequest({ method: "eth_requestAccounts", params: [], provider });
      return response;
    }

    if (chain === Chain.Solana) {
      const provider = await getCtrlProvider(Chain.Solana);

      const accounts = await provider.connect();
      return accounts.publicKey.toString();
    }

    if (chain === Chain.Near) {
      if (!window.xfi?.near) {
        throw new SwapKitError("wallet_ctrl_not_found", { chain: Chain.Near });
      }

      if (!window.xfi.near.isSignedIn?.()) {
        const result = await window.xfi.near.request<string[]>?.({ method: "connect" });
        return result?.[0] || "";
      }

      return window.xfi.near.getAccountId?.() || "";
    }

    const accounts = await eipProvider.request({ method: "request_accounts", params: [] });
    return accounts[0];
  } catch (_error) {
    throw new SwapKitError({ errorKey: "wallet_provider_not_found", info: { chain, wallet: WalletOption.CTRL } });
  }
}

export async function walletTransfer(
  { assetValue, recipient, memo, gasLimit }: WalletTxParams,
  method: TransactionMethod = "transfer",
) {
  if (!assetValue) {
    throw new SwapKitError("wallet_ctrl_asset_not_defined");
  }

  /**
   * EVM requires amount to be hex string
   * UTXO/Cosmos requires amount to be number
   */

  const from = await getCtrlAddress(assetValue.chain);
  const params = [
    {
      amount: { amount: assetValue.getBaseValue("number"), decimals: assetValue.decimal },
      asset: {
        chain: assetValue.chain,
        symbol: assetValue.symbol.toUpperCase(),
        ticker: assetValue.symbol.toUpperCase(),
      },
      from,
      gasLimit,
      memo: memo || "",
      recipient,
    },
  ];

  return transaction({ chain: assetValue.chain, method, params });
}
