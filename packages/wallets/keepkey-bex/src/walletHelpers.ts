import {
  type AssetValue,
  Chain,
  type ChainId,
  type EVMChain,
  EVMChains,
  type FeeOption,
  SwapKitError,
  WalletOption,
  erc20ABI,
  getRPCUrl,
} from "@swapkit/helpers";
import type { TransferParams } from "@swapkit/toolbox-cosmos";
import type {
  ApproveParams,
  BrowserProvider,
  CallParams,
  EVMTxParams,
  Eip1193Provider,
} from "@swapkit/toolbox-evm";

interface UTXOProvider {
  request: (
    args: {
      method: string;
      params?: {
        amount: { amount: string; decimals?: number };
        asset: { chain: Chain; symbol: string; ticker: string };
        memo: string | undefined;
        from?: string;
        recipient: string;
        gasLimit?: string | bigint;
      }[];
    },
    callback: (err: string, tx: string) => void,
  ) => void;
}

type TransactionMethod = "transfer" | "deposit";

type TransactionParams = {
  asset: string | { chain: string; symbol: string; ticker: string };
  amount: number | string | { amount: string | number; decimals?: number };
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
  gasLimit?: string | bigint | undefined;
};

export const getProviderNameFromChain = (chain: Chain): string => {
  switch (chain) {
    case Chain.Bitcoin:
      return "bitcoin";
    case Chain.BitcoinCash:
      return "bitcoincash";
    case Chain.Dash:
      return "dash";
    case Chain.Dogecoin:
      return "dogecoin";
    case Chain.Litecoin:
      return "litecoin";
    default:
      throw new Error("Unsupported chain");
  }
};

export function getKEEPKEYProvider<T extends Chain>(chain: T) {
  if (!window.keepkey) throw new SwapKitError("wallet_keepkey_not_found");

  switch (chain) {
    case Chain.Ethereum:
    case Chain.Base:
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
      return window.keepkey.ethereum as Eip1193Provider;
    case Chain.Cosmos:
      return window.keepkey.cosmos as Eip1193Provider;
    case Chain.Bitcoin:
      return window.keepkey.bitcoin as UTXOProvider;
    case Chain.BitcoinCash:
      return window.keepkey.bitcoincash as UTXOProvider;
    case Chain.Dogecoin:
      return window.keepkey.dogecoin as UTXOProvider;
    case Chain.Litecoin:
      return window.keepkey.litecoin as UTXOProvider;
    case Chain.Dash:
      return window.keepkey.dash as UTXOProvider;
    case Chain.THORChain:
      return window.keepkey.thorchain as UTXOProvider;
    case Chain.Maya:
      return window.keepkey.mayachain as UTXOProvider;

    default:
      return undefined;
  }
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
  const client = getKEEPKEYProvider(chain);

  return new Promise<string>((resolve, reject) => {
    if (client && "request" in client) {
      // @ts-ignore
      client.request({ method, params }, (err: string, tx: string) => {
        err ? reject(err) : resolve(tx);
      });
    } else {
      reject(new SwapKitError("wallet_provider_not_found"));
    }
  });
}

export async function getKEEPKEYAddress(chain: Chain) {
  const eipProvider = getKEEPKEYProvider(chain) as Eip1193Provider;
  if (!eipProvider) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.KEEPKEY, chain },
    });
  }

  let method = "request_accounts";
  if (EVMChains.includes(chain as EVMChain)) {
    method = "eth_requestAccounts";
  }

  const [response] = await eipProvider.request({ method, params: [] });
  return response;
}

export async function walletTransfer(
  { assetValue, recipient, memo, gasLimit }: WalletTxParams & { assetValue: AssetValue },
  method: TransactionMethod = "transfer",
) {
  if (!assetValue) {
    throw new SwapKitError("wallet_keepkey_asset_not_defined");
  }

  const from = await getKEEPKEYAddress(assetValue.chain);
  const params = [
    {
      amount: {
        amount: assetValue.getValue("string"),
        decimals: assetValue.decimal,
      },
      asset: {
        chain: assetValue.chain,
        symbol: assetValue.symbol.toUpperCase(),
        ticker: assetValue.symbol.toUpperCase(),
      },
      memo,
      from,
      recipient,
      gasLimit,
    },
  ];

  return transaction({ method, params, chain: assetValue.chain });
}

export function cosmosTransfer({
  chainId,
  rpcUrl,
}: {
  chainId: ChainId.Cosmos;
  rpcUrl?: string;
}) {
  return async ({ from, recipient, assetValue }: TransferParams) => {
    const { getMsgSendDenom, createSigningStargateClient } = await import(
      "@swapkit/toolbox-cosmos"
    );
    // @ts-expect-error assumed available connection
    const offlineSigner = window.keepkey?.cosmos?.getOfflineSignerOnlyAmino(chainId);
    const cosmJS = await createSigningStargateClient(
      rpcUrl || getRPCUrl(Chain.Cosmos),
      offlineSigner,
    );

    const coins = [
      {
        denom: getMsgSendDenom(assetValue.symbol).toLowerCase(),
        amount: assetValue.getBaseValue("string"),
      },
    ];

    try {
      const { transactionHash } = await cosmJS.sendTokens(from, recipient, coins, 2);
      return transactionHash;
    } catch (error) {
      throw new SwapKitError("core_transaction_failed", { error });
    }
  };
}

export function getKEEPKEYMethods(provider: BrowserProvider) {
  return {
    call: async <T>({
      contractAddress,
      abi,
      funcName,
      funcParams = [],
      txOverrides,
    }: CallParams): Promise<T> => {
      if (!contractAddress) {
        throw new SwapKitError("wallet_keepkey_contract_address_not_provided");
      }
      const { createContract, createContractTxObject, isStateChangingCall, toHexString } =
        await import("@swapkit/toolbox-evm");

      const isStateChanging = isStateChangingCall(abi, funcName);

      if (isStateChanging) {
        const { value, from, to, data } = await createContractTxObject(provider, {
          contractAddress,
          abi,
          funcName,
          funcParams,
          txOverrides,
        });

        return provider.send("eth_sendTransaction", [
          { value: toHexString(BigInt(value || 0)), from, to, data: data || "0x" },
        ]);
      }
      const contract = createContract(contractAddress, abi, provider);

      const result = await contract[funcName]?.(...funcParams);

      return typeof result?.hash === "string" ? result?.hash : result;
    },
    approve: async ({ assetAddress, spenderAddress, amount, from }: ApproveParams) => {
      const { MAX_APPROVAL, createContractTxObject, toHexString } = await import(
        "@swapkit/toolbox-evm"
      );

      const { value, to, data } = await createContractTxObject(provider, {
        contractAddress: assetAddress,
        abi: erc20ABI,
        funcName: "approve",
        funcParams: [spenderAddress, BigInt(amount || MAX_APPROVAL)],
        txOverrides: { from },
      });

      return provider.send("eth_sendTransaction", [
        { value: toHexString(BigInt(value || 0)), from, to, data: data || "0x" },
      ]);
    },
    sendTransaction: async (tx: EVMTxParams) => {
      const { from, to, data, value } = tx;
      if (!to) {
        throw new SwapKitError("wallet_keepkey_send_transaction_no_address");
      }

      const { toHexString } = await import("@swapkit/toolbox-evm");

      return provider.send("eth_sendTransaction", [
        { value: toHexString(BigInt(value || 0)), from, to, data: data || "0x" },
      ]);
    },
  };
}
