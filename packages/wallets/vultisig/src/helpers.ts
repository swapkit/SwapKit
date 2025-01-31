import {
  Chain,
  ChainToChainId,
  ChainToHexChainId,
  SwapKitError,
  WalletOption,
  addEVMWalletNetwork,
  prepareNetworkSwitch,
} from "@swapkit/helpers";

import type { AssetValue, ChainApi, EVMChain, FeeOption } from "@swapkit/helpers";
import type { Eip1193Provider } from "@swapkit/toolbox-evm";
import type { VultisigProvider } from ".";

type TransactionMethod = "eth_sendTransaction" | "send_transaction" | "deposit_transaction";

export type WalletTxParams = {
  feeOptionKey?: FeeOption;
  from?: string;
  memo?: string;
  recipient: string;
  assetValue: AssetValue;
  gasLimit?: string | bigint | undefined;
};

type TransactionParams = {
  value: string;
  memo?: string;
  from: string | string[];
  to: string;
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
  [Chain.Ethereum]: "ethereum",
};

export function getVultisigProvider<T extends Chain>(chain: T): VultisigProvider | undefined {
  if (!window.vultisig) {
    throw new SwapKitError("wallet_vultisig_not_found");
  }

  switch (chain) {
    case Chain.Ethereum:
      return window.vultisig.ethereum;
    case Chain.Kujira:
    case Chain.Cosmos:
      return window.vultisig.cosmos;
    case Chain.Bitcoin:
      return window.vultisig.bitcoin;
    case Chain.BitcoinCash:
      return window.vultisig.bitcoincash;
    case Chain.Dogecoin:
      return window.vultisig.dogecoin;
    case Chain.Litecoin:
      return window.vultisig.litecoin;
    case Chain.THORChain:
      return window.vultisig.thorchain;
    case Chain.Maya:
      return window.vultisig.maya;

    case Chain.Dash:
      return window.vultisig.dash;

    default:
      console.warn(`No provider found for chain: ${chain}. Returning undefined.`);
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
        if (err) {
          reject(err);
        } else {
          resolve(tx);
        }
      });
    }
  });
}

export async function getVultisigAddress(chain: Chain) {
  const provider = getVultisigProvider(chain) as VultisigProvider;
  if (!provider) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.VULTISIG, chain },
    });
  }

  if (chain === Chain.Ethereum) {
    const response = await provider.request({ method: "eth_requestAccounts" });
    if (!response) throw new SwapKitError("wallet_vultisig_no_account_found");
    return Array.isArray(response) ? response[0] : response;
  }
  if (chain === Chain.Cosmos || chain === Chain.Kujira) {
    await provider.request({
      method: "wallet_switch_chain",
      params: [{ chainId: ChainToChainId[chain] }],
    });
  }

  const response = await provider.request({ method: "request_accounts" });
  if (!response) throw new SwapKitError("wallet_vultisig_no_account_found");
  return Array.isArray(response) ? response[0] : response;
}

export async function walletTransfer(
  {
    assetValue,
    to,
    memo,
  }: Omit<WalletTxParams, "recipient"> & { assetValue: AssetValue; to: string },
  method: TransactionMethod,
) {
  if (!assetValue) {
    throw new SwapKitError("wallet_vultisig_asset_not_defined");
  }

  const from = (await getVultisigAddress(assetValue.chain)) as string;

  const params = [
    {
      value: `0x${assetValue.getBaseValue("number").toString(16)}`,
      data: memo,
      from,
      to,
    },
  ];

  const transactionResult = await transaction({ method, params, chain: assetValue.chain });

  return transactionResult;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity:
export async function getWalletForChain({
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
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

  if (vultiProvider in vultisig) {
    throw new SwapKitError("wallet_vultisig_not_found");
  }

  const address = await getVultisigAddress(chain);

  if (!address) throw new SwapKitError("wallet_vultisig_no_account_found");

  switch (chain) {
    case Chain.Ethereum: {
      const wallet = vultisig.ethereum;

      const { getProvider } = await import("@swapkit/toolbox-evm");

      const evmWallet = await getWeb3WalletMethods({
        chain,
        ethplorerApiKey,
        covalentApiKey,
        ethereumWindowProvider: wallet,
      });

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { ...evmWallet, getBalance, address };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");

      const toolbox = getToolboxByChain(chain);
      return {
        address,
        ...toolbox(),
        deposit: (tx: WalletTxParams) => walletTransfer({ ...tx, to: "" }, "deposit_transaction"),
        transfer: (tx: WalletTxParams) =>
          walletTransfer({ ...tx, to: tx.recipient }, "send_transaction"),
      };
    }
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-utxo");
      const toolbox = getToolboxByChain(chain)({ apiKey: blockchairApiKey });

      return {
        ...toolbox,
        transfer: (tx: WalletTxParams) =>
          walletTransfer({ ...tx, to: tx.recipient }, "send_transaction"),
      };
    }
    case Chain.Kujira: {
      const { KujiraToolbox } = await import("@swapkit/toolbox-cosmos");
      return {
        address,
        ...KujiraToolbox({ server: typeof api === "string" ? api : undefined }),
        transfer: (tx: WalletTxParams) => {
          return walletTransfer({ ...tx, to: tx.recipient }, "send_transaction");
        },
      };
    }
    case Chain.Cosmos: {
      const { GaiaToolbox } = await import("@swapkit/toolbox-cosmos");
      return {
        address,
        ...GaiaToolbox({ server: typeof api === "string" ? api : undefined }),
        transfer: (tx: WalletTxParams) => {
          return walletTransfer({ ...tx, to: tx.recipient }, "send_transaction");
        },
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
