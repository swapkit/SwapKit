import type { Keplr } from "@keplr-wallet/types";
import {
  type AssetValue,
  Chain,
  type ChainApi,
  ChainId,
  ChainToChainId,
  ChainToHexChainId,
  type EVMChain,
  SwapKitError,
  WalletOption,
  type WalletTxParams,
  addEVMWalletNetwork,
  getRPCUrl,
  prepareNetworkSwitch,
} from "@swapkit/helpers";
import type { TransferParams } from "@swapkit/toolbox-cosmos";
import type { Eip1193Provider } from "@swapkit/toolbox-evm";
import type { Psbt, UTXOTransferParams } from "@swapkit/toolbox-utxo";

type TransactionMethod = "transfer" | "deposit";

type TransactionParams = {
  asset: string | { chain: string; symbol: string; ticker: string };
  amount: number | string | { amount: number; decimals?: number };
  decimal?: number;
  recipient: string;
  memo?: string;
};

const ChainToVultisigWallet: Partial<Record<Chain, string>> = {
  [Chain.Bitcoin]: "bitcoin",
  [Chain.BitcoinCash]: "bitcoincash",
  [Chain.Dogecoin]: "dogecoin",
  [Chain.Litecoin]: "litecoin",
  [Chain.THORChain]: "thorchain",
  [Chain.Dash]: "dash",
  [Chain.Cosmos]: "cosmos",
  [Chain.Kujira]: "cosmos",
};

export function getVultisigProvider<T extends Chain>(
  chain: T,
): T extends Chain.Cosmos | Chain.Kujira
  ? Keplr
  : T extends EVMChain
    ? Eip1193Provider
    : undefined {
  if (!window.vultisig) throw new SwapKitError("wallet_vultisig_not_found");

  switch (chain) {
    case Chain.Ethereum:
      // @ts-expect-error
      return window.vultisig.ethereum;

    case Chain.Kujira:
      // @ts-expect-error
      return window.vultisig.cosmos;

    case Chain.Cosmos:
      // @ts-expect-error
      return window.vultisig.cosmos;

    case Chain.Bitcoin:
      // @ts-expect-error
      return window.vultisig.bitcoin;
    case Chain.BitcoinCash:
      // @ts-expect-error
      return window.vultisig.bitcoincash;
    case Chain.Dogecoin:
      // @ts-expect-error
      return window.vultisig.dogecoin;
    case Chain.Litecoin:
      // @ts-expect-error
      return window.vultisig.litecoin;
    case Chain.THORChain:
      // @ts-expect-error
      return window.vultisig.thorchain;
    case Chain.Maya:
      // @ts-expect-error
      return window.vultisig.mayachain;
    case Chain.Solana:
      // @ts-expect-error
      return window.vultisig.solana;

    default:
      // @ts-expect-error
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
  const client = getVultisigProvider(chain);

  return new Promise<string>((resolve, reject) => {
    if (client && "request" in client) {
      // @ts-ignore
      client.request({ method, params }, (err: string, tx: string) => {
        err ? reject(err) : resolve(tx);
      });
    }
  });
}

export async function getVultisigAddress(chain: Chain) {
  console.log(chain, "chain");
  const eipProvider = getVultisigProvider(chain) as Eip1193Provider;
  console.log(eipProvider, "eipProvider");
  if (!eipProvider) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.VULTISIG, chain },
    });
  }

  if ([Chain.Cosmos, Chain.Kujira].includes(chain)) {
    const provider = getVultisigProvider(Chain.Cosmos);
    if (!provider || "request" in provider) {
      throw new SwapKitError({
        errorKey: "wallet_provider_not_found",
        info: { wallet: WalletOption.VULTISIG, chain },
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

  if (chain === Chain.Ethereum) {
    const [response] = await eipProvider.request({ method: "eth_requestAccounts" });

    return response;
  }

  return new Promise((resolve, reject) =>
    eipProvider.request(
      { method: "request_accounts" },
      // @ts-expect-error
      (error: any, [response]: string[]) => (error ? reject(error) : resolve(response)),
    ),
  );
}

export async function walletTransfer(
  { assetValue, recipient, memo, gasLimit }: WalletTxParams & { assetValue: AssetValue },
  method: TransactionMethod = "transfer",
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
      memo,
      from,
      recipient,
      gasLimit,
    },
  ];

  return transaction({ method, params, chain: assetValue.chain });
}

export function cosmosTransfer(rpcUrl?: string) {
  return async ({ from, recipient, assetValue, memo }: TransferParams) => {
    const { getMsgSendDenom, createSigningStargateClient } = await import(
      "@swapkit/toolbox-cosmos"
    );
    if (!(window.vultisig && "keplr" in window.vultisig)) {
      throw new SwapKitError("wallet_vultisig_not_found");
    }

    const { keplr: wallet } = window.vultisig;

    const offlineSigner = wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos);
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
      const { transactionHash } = await cosmJS.sendTokens(from, recipient, coins, 2, memo);
      return transactionHash;
    } catch (error) {
      throw new SwapKitError("core_transaction_failed", { error });
    }
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity:
export async function getWalletForChain({
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  rpcUrl,
  api,
}: {
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  blockchairApiKey?: string;
  rpcUrl?: string;
  api?: ChainApi;
}) {
  const vultisig = window.vultisig;
  if (!vultisig) throw new SwapKitError("wallet_vultisig_not_found");
  const vultiProvider = ChainToVultisigWallet[chain] as string;

  switch (chain) {
    case Chain.Ethereum: {
      if (!(vultisig && "ethereum" in vultisig)) {
        throw new SwapKitError("wallet_vultisig_not_found");
      }

      const wallet = vultisig.ethereum;

      const { getProvider } = await import("@swapkit/toolbox-evm");

      const evmWallet = await getWeb3WalletMethods({
        chain,
        ethplorerApiKey,
        covalentApiKey,
        ethereumWindowProvider: wallet,
      });

      const [address]: [string, ...string[]] = await wallet.request({
        method: "eth_requestAccounts",
      });

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { ...evmWallet, getBalance, address };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
        "@swapkit/toolbox-cosmos"
      );

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = getToolboxByChain(chain);

      return {
        ...toolbox(),
        deposit: (tx: WalletTxParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
        transfer: (tx: WalletTxParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
      };
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      console.log(chain, vultisig, vultiProvider in vultisig);
      if (!(vultisig && vultiProvider in vultisig)) {
        throw new SwapKitError("wallet_vultisig_not_found");
      }
      const wallet = vultisig[vultiProvider];

      const { Psbt, BTCToolbox } = await import("@swapkit/toolbox-utxo");

      const [address] = await wallet.request({ method: "request_accounts" });
      console.log(address);
      const apiClient = typeof api === "object" && "getConfirmedBalance" in api ? api : undefined;

      const toolbox = BTCToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient });
      const signTransaction = async (psbt: Psbt) => {
        const signedPsbt = await wallet.request({ method: "sign_psbt", params: [psbt] });
        console.log(`${chain} Transaction Hash:`, signedPsbt);
        return Psbt.fromHex(signedPsbt);
      };

      const transfer = (transferParams: UTXOTransferParams) => {
        return toolbox.transfer({ ...transferParams, signTransaction });
      };

      return { ...toolbox, transfer, address };
    }
    case Chain.Kujira:
    case Chain.Cosmos: {
      if (!(vultisig && vultiProvider in vultisig)) {
        throw new SwapKitError("wallet_vultisig_not_found");
      }
      const wallet = vultisig[vultiProvider];

      const accounts = await wallet.request({ method: "request_accounts" });
      console.log(accounts);
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { GaiaToolbox } = await import("@swapkit/toolbox-cosmos");
      const [{ address }] = accounts;

      return {
        address,
        ...GaiaToolbox({ server: typeof api === "string" ? api : undefined }),
        transfer: cosmosTransfer(rpcUrl),
      };
    }

    default:
      throw new SwapKitError("wallet_chain_not_supported");
  }
}

export const getWeb3WalletMethods = async ({
  ethereumWindowProvider,
  chain,
  covalentApiKey,
  ethplorerApiKey,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: EVMChain;
  covalentApiKey?: string;
  ethplorerApiKey?: string;
}) => {
  const { getToolboxByChain, BrowserProvider } = await import("@swapkit/toolbox-evm");
  if (!ethereumWindowProvider) throw new SwapKitError("wallet_provider_not_found");

  if (
    (chain !== Chain.Ethereum && !covalentApiKey) ||
    (chain === Chain.Ethereum && !ethplorerApiKey)
  ) {
    throw new SwapKitError({
      errorKey: "wallet_missing_api_key",
      info: {
        missingKey: chain === Chain.Ethereum ? "ethplorerApiKey" : "covalentApiKey",
        chain,
      },
    });
  }

  const provider = new BrowserProvider(ethereumWindowProvider, "any");

  const toolbox = getToolboxByChain(chain)({
    provider,
    signer: await provider.getSigner(),
    ethplorerApiKey: ethplorerApiKey as string,
    covalentApiKey: covalentApiKey as string,
  });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await addEVMWalletNetwork(provider, toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }

  return prepareNetworkSwitch({ toolbox, provider, chainId: ChainToHexChainId[chain] });
};
