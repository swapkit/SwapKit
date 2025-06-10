import type { Keplr } from "@keplr-wallet/types";
import {
  type AssetValue,
  Chain,
  ChainToChainId,
  type EVMChain,
  EVMChains,
  type FeeOption,
  SwapKitError,
  WalletOption,
  providerRequest,
} from "@swapkit/helpers";
import { erc20ABI } from "@swapkit/helpers/contracts";
import type { ApproveParams, CallParams, EVMTxParams } from "@swapkit/toolboxes/evm";
import type { SolanaProvider } from "@swapkit/toolboxes/solana";
import type { BrowserProvider, Eip1193Provider } from "ethers";

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
    : T extends Chain.Cosmos | Chain.Kujira
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
      Chain.Avalanche,
      Chain.Base,
      Chain.BinanceSmartChain,
      Chain.Ethereum,
      Chain.Optimism,
      Chain.Polygon,
      () => window.xfi?.ethereum,
    )
    .with(Chain.Cosmos, Chain.Kujira, Chain.Maya, Chain.THORChain, () => window.xfi?.keplr)
    .with(Chain.Bitcoin, () => window.xfi?.bitcoin)
    .with(Chain.BitcoinCash, () => window.xfi?.bitcoincash)
    .with(Chain.Dogecoin, () => window.xfi?.dogecoin)
    .with(Chain.Litecoin, () => window.xfi?.litecoin)
    .with(Chain.Solana, () => window.xfi?.solana)
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
      // @ts-ignore
      client.request({ method, params }, (err: string, tx: string) => {
        err ? reject(err) : resolve(tx);
      });
    }
  });
}

export async function getCtrlAddress(chain: Chain) {
  const eipProvider = (await getCtrlProvider(chain)) as Eip1193Provider;
  if (!eipProvider) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.CTRL, chain },
    });
  }

  if ([Chain.Cosmos, Chain.Kujira].includes(chain)) {
    const provider = await getCtrlProvider(Chain.Cosmos);
    if (!provider || "request" in provider) {
      throw new SwapKitError({
        errorKey: "wallet_provider_not_found",
        info: { wallet: WalletOption.CTRL, chain },
      });
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
    const [response] = await providerRequest({
      provider,
      method: "eth_requestAccounts",
      params: [],
    });
    return response;
  }

  if (chain === Chain.Solana) {
    const provider = await getCtrlProvider(Chain.Solana);

    const accounts = await provider.connect();
    return accounts.publicKey.toString();
  }

  try {
    // For CTRL wallet, try direct request method first
    if ("request" in eipProvider && typeof eipProvider.request === "function") {
      const accounts = await eipProvider.request({ method: "eth_requestAccounts" });
      return accounts[0];
    }
    const { BrowserProvider } = await import("ethers");
    const provider = new BrowserProvider(eipProvider, "any");
    const [response] = await providerRequest({
      provider,
      method: "eth_requestAccounts",
      params: [],
    });
    return response;
  } catch (_error) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.CTRL, chain },
    });
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
      amount: {
        amount: assetValue.getBaseValue("number"),
        decimals: assetValue.decimal,
      },
      asset: {
        chain: assetValue.chain,
        symbol: assetValue.symbol.toUpperCase(),
        ticker: assetValue.symbol.toUpperCase(),
      },
      memo: memo || "",
      from,
      recipient,
      gasLimit,
    },
  ];

  return transaction({ method, params, chain: assetValue.chain });
}

export function getCtrlMethods(provider: BrowserProvider, chain: EVMChain) {
  return {
    call: async <T>({
      contractAddress,
      abi,
      funcName,
      funcParams = [],
      txOverrides,
    }: CallParams): Promise<T> => {
      if (!contractAddress) {
        throw new SwapKitError("wallet_ctrl_contract_address_not_provided");
      }
      const { createContract, getCreateContractTxObject, isStateChangingCall } = await import(
        "@swapkit/toolboxes/evm"
      );

      const isStateChanging = isStateChangingCall({ abi, funcName });

      if (isStateChanging) {
        const createTx = getCreateContractTxObject({ provider, chain });
        const { value, from, to, data } = await createTx({
          contractAddress,
          abi,
          funcName,
          funcParams,
          txOverrides,
        });

        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          value: BigInt(value || 0),
          from,
          to,
          data: data || "0x",
        });
        return tx.hash as T;
      }
      const contract = createContract(contractAddress, abi, provider);

      const result = await contract[funcName]?.(...funcParams);

      return typeof result?.hash === "string" ? result?.hash : result;
    },
    approve: async ({ assetAddress, spenderAddress, amount, from }: ApproveParams) => {
      const { MAX_APPROVAL, getCreateContractTxObject } = await import("@swapkit/toolboxes/evm");
      const funcParams = [spenderAddress, BigInt(amount || MAX_APPROVAL)];
      const txOverrides = { from };

      const functionCallParams = {
        contractAddress: assetAddress,
        abi: erc20ABI,
        funcName: "approve",
        funcParams,
        txOverrides,
      };

      const createTx = getCreateContractTxObject({ provider, chain });
      const { value, to, data } = await createTx(functionCallParams);

      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        value: BigInt(value || 0),
        from,
        to,
        data: data || "0x",
      });
      return tx.hash;
    },
    sendTransaction: async (txParams: EVMTxParams) => {
      const { from, to, data, value } = txParams;
      if (!to) {
        throw new SwapKitError("wallet_ctrl_send_transaction_no_address");
      }

      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        value: BigInt(value || 0),
        from,
        to,
        data: data || "0x",
      });
      return tx.hash;
    },
  };
}
