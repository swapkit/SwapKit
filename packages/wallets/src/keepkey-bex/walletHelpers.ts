import {
  type AssetValue,
  Chain,
  type EVMChain,
  EVMChains,
  type FeeOption,
  SwapKitError,
  WalletOption,
} from "@swapkit/helpers";
import { erc20ABI } from "@swapkit/helpers/contracts";
import type { ApproveParams, CallParams, EVMTxParams } from "@swapkit/toolboxes/evm";
import type { BrowserProvider, Eip1193Provider } from "ethers";

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
      throw new SwapKitError("wallet_keepkey_chain_not_supported", { chain });
  }
};

declare const window: {
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
} & Window;

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
    case Chain.XLayer:
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

function transaction({
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
      // @ts-expect-error
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
    throw new SwapKitError({ errorKey: "wallet_provider_not_found", info: { chain, wallet: WalletOption.KEEPKEY } });
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
      amount: { amount: assetValue.getValue("string"), decimals: assetValue.decimal },
      asset: {
        chain: assetValue.chain,
        symbol: assetValue.symbol.toUpperCase(),
        ticker: assetValue.symbol.toUpperCase(),
      },
      from,
      gasLimit,
      memo,
      recipient,
    },
  ];

  return transaction({ chain: assetValue.chain, method, params });
}

export function getKEEPKEYMethods(provider: BrowserProvider, chain: EVMChain) {
  return {
    approve: async ({ assetAddress, spenderAddress, amount, from }: ApproveParams) => {
      const { MAX_APPROVAL, getCreateContractTxObject, toHexString } = await import("@swapkit/toolboxes/evm");

      const createTx = getCreateContractTxObject({ chain, provider });
      const { value, to, data } = await createTx({
        abi: erc20ABI,
        contractAddress: assetAddress,
        funcName: "approve",
        funcParams: [spenderAddress, BigInt(amount || MAX_APPROVAL)],
        txOverrides: { from },
      });

      return provider.send("eth_sendTransaction", [
        { data: data || "0x", from, to, value: toHexString(BigInt(value || 0)) },
      ]);
    },
    call: async <T>({ contractAddress, abi, funcName, funcParams = [], txOverrides }: CallParams): Promise<T> => {
      if (!contractAddress) {
        throw new SwapKitError("wallet_keepkey_contract_address_not_provided");
      }
      const { createContract, getCreateContractTxObject, isStateChangingCall, toHexString } = await import(
        "@swapkit/toolboxes/evm"
      );

      const isStateChanging = isStateChangingCall({ abi, funcName });

      if (isStateChanging) {
        const createTx = getCreateContractTxObject({ chain, provider });
        const { value, from, to, data } = await createTx({ abi, contractAddress, funcName, funcParams, txOverrides });

        return provider.send("eth_sendTransaction", [
          { data: data || "0x", from, to, value: toHexString(BigInt(value || 0)) },
        ]);
      }
      const contract = createContract(contractAddress, abi, provider);

      const result = await contract[funcName]?.(...funcParams);

      return typeof result?.hash === "string" ? result?.hash : result;
    },
    sendTransaction: async (tx: EVMTxParams) => {
      const { from, to, data, value } = tx;
      if (!to) {
        throw new SwapKitError("wallet_keepkey_send_transaction_no_address");
      }

      const { toHexString } = await import("@swapkit/toolboxes/evm");

      return provider.send("eth_sendTransaction", [
        { data: data || "0x", from, to, value: toHexString(BigInt(value || 0)) },
      ]);
    },
  };
}
