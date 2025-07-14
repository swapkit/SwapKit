import {
  type AssetValue,
  Chain,
  ChainToChainId,
  type EVMChain,
  EVMChains,
  type FeeOption,
  type NetworkParams,
  SwapKitError,
  type UTXOChain,
  WalletOption,
  providerRequest,
} from "@swapkit/helpers";
import { erc20ABI } from "@swapkit/helpers/contracts";
import type { getCosmosToolbox } from "@swapkit/toolboxes/cosmos";
import type { ApproveParams, CallParams, EVMTxParams } from "@swapkit/toolboxes/evm";
import type { SolanaProvider } from "@swapkit/toolboxes/solana";
import type { BrowserProvider, Eip1193Provider } from "ethers";
import type { VultisigCosmosProvider } from "../types";

type TransactionMethod = "send_transaction" | "deposit_transaction";

type TransactionParams = {
  asset: string | { chain: string; symbol: string; ticker: string };
  amount: number | string | { amount: number; decimals?: number };
  decimal?: number;
  to: string;
  data?: string;
  from?: string;
};

export type WalletTxParams = {
  feeOptionKey?: FeeOption;
  from?: string;
  memo?: string;
  recipient: string;
  assetValue: AssetValue;
  gasLimit?: string | bigint;
};

type VultisigProviderType<T> = T extends Chain.Solana
  ? SolanaProvider
  : T extends Chain.Cosmos | Chain.Kujira
    ? VultisigCosmosProvider
    : T extends EVMChain
      ? Eip1193Provider
      : T extends Chain.Maya | Chain.THORChain | Chain.Ripple | Chain.Polkadot | UTXOChain
        ? Eip1193Provider
        : undefined;

export async function getVultisigProvider<T extends Chain>(
  chain: T,
): Promise<VultisigProviderType<T>> {
  if (!window.vultisig) throw new SwapKitError("wallet_vultisig_not_found");
  const { match } = await import("ts-pattern");

  return match(chain as Chain)
    .with(...EVMChains, () => window.vultisig?.ethereum as Eip1193Provider)
    .with(Chain.Cosmos, Chain.Kujira, () => window.vultisig?.cosmos as VultisigCosmosProvider)
    .with(Chain.Bitcoin, () => window.vultisig?.bitcoin as Eip1193Provider)
    .with(Chain.BitcoinCash, () => window.vultisig?.bitcoincash as Eip1193Provider)
    .with(Chain.Dash, () => window.vultisig?.dash as Eip1193Provider)
    .with(Chain.Dogecoin, () => window.vultisig?.dogecoin as Eip1193Provider)
    .with(Chain.Litecoin, () => window.vultisig?.litecoin as Eip1193Provider)
    .with(Chain.Solana, () => window.vultisig?.solana as SolanaProvider)
    .with(Chain.THORChain, () => window.vultisig?.thorchain as Eip1193Provider)
    .with(Chain.Maya, () => window.vultisig?.mayachain as Eip1193Provider)
    .with(Chain.Polkadot, () => window.vultisig?.polkadot as Eip1193Provider)
    .with(Chain.Ripple, () => window.vultisig?.ripple as Eip1193Provider)
    .with(Chain.Zcash, () => window.vultisig?.zcash as Eip1193Provider)
    .otherwise(() => undefined) as VultisigProviderType<T>;
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
  const client = await getVultisigProvider(chain);
  let finalParams:
    | TransactionParams[]
    | {
        from: string;
        to?: string;
        value: string;
        data?: string;
      }[] = params;

  if (chain === Chain.Cosmos || chain === Chain.Kujira || chain === Chain.Ripple) {
    finalParams = params.map((p) => ({
      from: p.from as string,
      to: p.to as string,
      value: (p.amount as { amount: number; decimals?: number }).amount.toString(),
      data: p.data as string,
    }));
  }

  return new Promise<string>((resolve, reject) => {
    if (client && "request" in client) {
      // @ts-ignore
      client.request({ method, params: finalParams }, (err: string, tx: string) => {
        err ? reject(err) : resolve(tx);
      });
    }
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export async function getVultisigAddress(chain: Chain) {
  try {
    const eipProvider = (await getVultisigProvider(chain)) as Eip1193Provider;
    if (!eipProvider) {
      throw new SwapKitError({
        errorKey: "wallet_provider_not_found",
        info: { wallet: WalletOption.VULTISIG, chain },
      });
    }

    if ([Chain.Cosmos, Chain.Kujira].includes(chain)) {
      const provider = await getVultisigProvider(Chain.Cosmos);
      const chainId = ChainToChainId[chain];

      await provider.request({
        method: "wallet_switch_chain",
        params: [{ chainId }],
      });

      let account = await provider.request({
        method: "get_accounts",
      });
      if (!account) {
        const connectedAcount = await provider.request({
          method: "request_accounts",
        });
        account = connectedAcount[0].address;
      }
      return account;
    }

    if (EVMChains.includes(chain as EVMChain)) {
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
      const provider = await getVultisigProvider(Chain.Solana);

      const accounts = await provider.connect();
      return accounts.publicKey.toString();
    }

    const accounts = await eipProvider.request({ method: "request_accounts", params: [] });
    return accounts[0];
  } catch (_error) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.VULTISIG, chain },
    });
  }
}

export async function walletTransfer(
  { assetValue, recipient, memo, gasLimit }: WalletTxParams,
  method: TransactionMethod = "send_transaction",
) {
  if (!assetValue) {
    throw new SwapKitError("wallet_vultisig_asset_not_defined");
  }

  /**
   * EVM requires amount to be hex string
   * UTXO/Cosmos requires amount to be number
   */

  const from = await getVultisigAddress(assetValue.chain);
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
      data: memo || "",
      from,
      to: recipient,
      gasLimit,
    },
  ];

  return transaction({ method, params, chain: assetValue.chain });
}

export function getVultisigMethods(provider: BrowserProvider, chain: EVMChain) {
  return {
    call: async <T>({
      contractAddress,
      abi,
      funcName,
      funcParams = [],
      txOverrides,
    }: CallParams): Promise<T> => {
      if (!contractAddress) {
        throw new SwapKitError("wallet_vultisig_contract_address_not_provided");
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
        throw new SwapKitError("wallet_vultisig_send_transaction_no_address");
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

export async function switchCosmosWalletNetwork(
  provider: VultisigCosmosProvider,
  chain: Chain.Cosmos | Chain.Kujira,
  networkParams?: NetworkParams,
) {
  try {
    await provider.request({
      method: "wallet_switch_chain",
      params: [{ chainId: ChainToChainId[chain] }],
    });
  } catch (error) {
    if (!networkParams) {
      throw new SwapKitError("helpers_failed_to_switch_network", {
        error: error,
        reason: "networkParams not provided",
      });
    }
  }
}

export function wrapMethodWithNetworkSwitch<T extends (...args: any[]) => any>(
  func: T,
  provider: VultisigCosmosProvider,
  chain: Chain.Cosmos | Chain.Kujira,
) {
  return (async (...args: any[]) => {
    try {
      await switchCosmosWalletNetwork(provider, chain);
    } catch (error) {
      throw new SwapKitError({
        errorKey: "helpers_failed_to_switch_network",
        info: { error },
      });
    }
    return func(...args);
  }) as unknown as T;
}

export function prepareNetworkSwitchCosmos<
  T extends Awaited<ReturnType<typeof getCosmosToolbox>>,
  M extends keyof T,
>({
  toolbox,
  chain,
  provider = window.ethereum,
  methodNames = [],
}: { toolbox: T; chain: Chain; provider?: VultisigCosmosProvider; methodNames?: M[] }) {
  const methodsToWrap = [...methodNames, "transfer", "getAddress", "getBalance"] as M[];
  const wrappedMethods = methodsToWrap.reduce((object, methodName) => {
    if (!toolbox[methodName]) return object;

    const method = toolbox[methodName];

    if (typeof method !== "function") return object;

    // @ts-expect-error
    const wrappedMethod = wrapMethodWithNetworkSwitch(method, provider, chain);

    // biome-ignore lint/performance/noAccumulatingSpread: valid use case
    return { ...object, [methodName]: wrappedMethod };
  }, {});

  return { ...toolbox, ...wrappedMethods };
}
