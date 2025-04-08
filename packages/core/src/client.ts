import type { EVMTransaction, QuoteResponseRoute } from "@swapkit/helpers/api";

import {
  ApproveMode,
  type ApproveReturnType,
  AssetValue,
  Chain,
  type ChainWallet,
  type ConditionalAssetValueReturn,
  type EVMChain,
  EVMChains,
  type FeeOption,
  type FullWallet,
  ProviderName as PluginNameEnum,
  SKConfig,
  type SKConfigState,
  SwapKitError,
  type SwapParams,
  type createPlugin,
  type createWallet,
} from "@swapkit/helpers";
import type { TransferParams as CosmosTransferParams } from "@swapkit/toolboxes/cosmos";
import type { TransferParams as EVMTransferParams } from "@swapkit/toolboxes/evm";
import type { UTXOTransferParams } from "@swapkit/toolboxes/utxo";

import {
  getExplorerAddressUrl as getAddressUrl,
  getExplorerTxUrl as getTxUrl,
} from "./helpers/explorerUrls";

export type SwapKitParams<P, W> = {
  config?: SKConfigState;
  plugins?: P;
  wallets?: W;
};

export function SwapKit<
  Plugins extends ReturnType<typeof createPlugin>,
  Wallets extends ReturnType<typeof createWallet>,
>({
  config,
  plugins,
  wallets,
}: { config?: SKConfigState; plugins?: Plugins; wallets?: Wallets } = {}) {
  if (config) {
    SKConfig.set(config);
  }

  type PluginName = keyof Plugins;
  const connectedWallets = {} as FullWallet;
  type ConnectedChains = keyof typeof connectedWallets;

  const availablePlugins = Object.entries(plugins || {}).reduce(
    (acc, [pluginName, plugin]) => {
      const methods = plugin({ getWallet });

      acc[pluginName as PluginName] = methods as ReturnType<Plugins[keyof Plugins]>;
      return acc;
    },
    {} as { [key in PluginName]: ReturnType<Plugins[key]> },
  );

  const connectWalletMethods = Object.entries(wallets || {}).reduce(
    (acc, [walletName, wallet]) => {
      const connectWallet = wallet.connectWallet({ addChain });

      acc[walletName as keyof Wallets] = connectWallet as ReturnType<
        Wallets[keyof Wallets]["connectWallet"]
      >;
      return acc;
    },
    {} as {
      [key in keyof Wallets]: ReturnType<Wallets[key]["connectWallet"]>;
    },
  );

  function getSwapKitPlugin<T extends PluginName>(pluginName?: T) {
    const availablePlugin = pluginName && availablePlugins[pluginName];
    const plugin = availablePlugin || Object.values(availablePlugins)[0];

    if (!plugin) {
      throw new SwapKitError("core_plugin_not_found");
    }

    return plugin as ReturnType<Plugins[T]>;
  }

  function addChain<T extends Chain>(
    connectWallet: Omit<ChainWallet<T>, "balance"> & { balance?: AssetValue[] },
  ) {
    const currentWallet = getWallet(connectWallet.chain);

    const balance = connectWallet.balance ||
      currentWallet.balance || [AssetValue.from({ chain: connectWallet.chain })];

    const wallet = { ...currentWallet, ...connectWallet, balance } as FullWallet[T];

    connectedWallets[connectWallet.chain] = wallet;

    return wallet;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  function approve<T extends ApproveMode>({
    assetValue,
    type = "checkOnly" as T,
    contractAddress: spenderAddress,
  }: {
    type: T;
    assetValue: AssetValue;
    contractAddress: string | PluginName;
  }) {
    const plugin = availablePlugins[spenderAddress];

    if (plugin) {
      if (type === ApproveMode.CheckOnly && "isAssetValueApproved" in plugin) {
        // @ts-expect-error TODO: add optional approve for plugin
        return plugin.isAssetValueApproved({ assetValue }) as ApproveReturnType<T>;
      }
      if (type === ApproveMode.Approve && "approveAssetValue" in plugin) {
        // @ts-expect-error TODO: add optional approve for plugin
        return plugin.approveAssetValue({ assetValue }) as ApproveReturnType<T>;
      }

      throw new SwapKitError({
        errorKey: "core_approve_asset_target_invalid",
        info: { message: `Target ${String(spenderAddress)} cannot be used for approve operation` },
      });
    }

    const chain = assetValue.chain as EVMChain;
    const isEVMChain = EVMChains.includes(chain);
    const isNativeEVM = isEVMChain && assetValue.isGasAsset;

    if (isNativeEVM || !isEVMChain || assetValue.isSynthetic) {
      return Promise.resolve(type === "checkOnly" ? true : "approved") as ApproveReturnType<T>;
    }

    const wallet = getWallet(chain);
    const walletAction = type === "checkOnly" ? wallet.isApproved : wallet.approve;
    if (!walletAction) throw new SwapKitError("core_wallet_connection_not_found");

    if (!(assetValue.address && wallet.address && typeof spenderAddress === "string")) {
      throw new SwapKitError("core_approve_asset_address_or_from_not_found");
    }

    return walletAction({
      amount: assetValue.getBaseValue("bigint"),
      assetAddress: assetValue.address,
      from: wallet.address,
      spenderAddress,
    }) as ApproveReturnType<T>;
  }

  /**
   * @Public
   */
  function getWallet<T extends ConnectedChains>(chain: T) {
    return connectedWallets[chain] || {};
  }

  function getAllWallets() {
    return { ...connectedWallets };
  }

  function getAddress<T extends Chain>(chain: T) {
    return getWallet(chain)?.address || "";
  }

  function approveAssetValue(assetValue: AssetValue, contractAddress: string | PluginName) {
    return approve({ assetValue, contractAddress, type: ApproveMode.Approve });
  }

  function isAssetValueApproved(assetValue: AssetValue, contractAddress: string | PluginName) {
    return approve({ assetValue, contractAddress, type: ApproveMode.CheckOnly });
  }

  function disconnectChain<T extends Chain>(chain: T) {
    const wallet = getWallet(chain);
    wallet?.disconnect?.();
    delete connectedWallets[chain];
  }

  function disconnectAll() {
    for (const chain of Object.keys(connectedWallets) as (keyof typeof connectedWallets)[]) {
      disconnectChain(chain);
    }
  }

  function getBalance<T extends Chain, R extends boolean>(
    chain: T,
    refresh?: R,
  ): ConditionalAssetValueReturn<R> {
    return (
      refresh
        ? getWalletWithBalance(chain).then(({ balance }) => balance)
        : getWallet(chain)?.balance || []
    ) as ConditionalAssetValueReturn<R>;
  }

  async function getWalletWithBalance<T extends Chain>(chain: T, scamFilter = true) {
    if (chain === Chain.Fiat || !getWallet(chain)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }
    const wallet = getWallet(chain as Exclude<Chain, Chain.Fiat>);
    const defaultBalance = [AssetValue.from({ chain })];

    if ("getBalance" in wallet) {
      const balance = await wallet.getBalance(wallet.address, scamFilter);
      wallet.balance = balance?.length ? balance : defaultBalance;
    }

    return wallet;
  }

  function swap<T extends PluginName>({
    route,
    pluginName,
    ...rest
  }: SwapParams<T, QuoteResponseRoute>) {
    const plugin = getSwapKitPlugin(pluginName || route.providers[0]);

    if ("swap" in plugin) {
      // @ts-expect-error TODO: fix this
      return plugin.swap({ ...rest, route });
    }

    throw new SwapKitError("core_plugin_swap_not_found");
  }

  function transfer({
    assetValue,
    ...params
  }: UTXOTransferParams | EVMTransferParams | CosmosTransferParams) {
    const chain = assetValue.chain;
    if ([Chain.Fiat, Chain.Radix].includes(chain) || !getWallet(chain)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }
    const wallet = getWallet(chain as Exclude<Chain, Chain.Fiat | Chain.Radix>);

    // @ts-expect-error TODO: right now it's inferred from toolboxes
    // we need to simplify this to one object params
    return wallet.transfer({ ...params, assetValue });
  }

  function signMessage({ chain, message }: { chain: Chain; message: string }) {
    const wallet = getWallet(chain);
    if (!wallet) throw new SwapKitError("core_wallet_connection_not_found");

    if ("signMessage" in wallet) {
      return wallet.signMessage?.(message);
    }

    throw new SwapKitError({
      errorKey: "core_wallet_sign_message_not_supported",
      info: { chain, wallet: wallet.walletType },
    });
  }

  async function verifyMessage({
    address,
    chain,
    message,
    signature,
  }: { chain: Chain; signature: string; message: string; address: string }) {
    switch (chain) {
      case Chain.THORChain: {
        const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
        const toolbox = getCosmosToolbox(chain);
        return toolbox.verifySignature({ signature, message, address });
      }

      default:
        throw new SwapKitError({ errorKey: "core_verify_message_not_supported", info: { chain } });
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO clean this up
  async function estimateTransactionFee<T extends PluginName>({
    type,
    feeOptionKey,
    params,
  }: (
    | { type: "swap"; params: SwapParams<T, QuoteResponseRoute> & { assetValue: AssetValue } }
    | { type: "transfer"; params: UTXOTransferParams | EVMTransferParams | CosmosTransferParams }
    | {
        type: "approve";
        params: {
          assetValue: AssetValue;
          contractAddress: string | PluginName;
          feeOptionKey?: FeeOption;
        };
      }
  ) & {
    feeOptionKey: FeeOption;
  }): Promise<AssetValue | undefined> {
    const { assetValue } = params;
    const { chain } = assetValue;

    if (!getWallet(chain as Chain)) throw new SwapKitError("core_wallet_connection_not_found");

    const baseValue = AssetValue.from({ chain });

    switch (chain) {
      case Chain.Arbitrum:
      case Chain.Avalanche:
      case Chain.Ethereum:
      case Chain.BinanceSmartChain:
      case Chain.Polygon: {
        const wallet = getWallet(chain);
        if (type === "transfer") {
          const txObject = await wallet.createTransferTx(params);
          return wallet.estimateTransactionFee({ ...txObject, chain, feeOption: feeOptionKey });
        }

        if (type === "approve" && !assetValue.isGasAsset) {
          const approvalTx = await wallet.createApprovalTx({
            assetAddress: assetValue.address as string,
            spenderAddress: params.contractAddress as string,
            amount: assetValue.getBaseValue("bigint"),
            from: wallet.address,
          });

          return wallet.estimateTransactionFee({ ...approvalTx, chain, feeOption: feeOptionKey });
        }

        if (type === "swap") {
          const plugin = params.route.providers[0] as PluginNameEnum;
          if ([PluginNameEnum.CHAINFLIP, PluginNameEnum.CHAINFLIP_STREAMING].includes(plugin)) {
            const txObject = await wallet.createTransferTx({
              from: wallet.address,
              recipient: wallet.address,
              assetValue,
            });

            return wallet.estimateTransactionFee({ ...txObject, chain, feeOption: feeOptionKey });
          }

          const { tx } = params.route;
          if (!tx) {
            return undefined;
          }

          return wallet.estimateTransactionFee({
            ...(tx as EVMTransaction),
            value: BigInt((tx as EVMTransaction).value),
            feeOption: feeOptionKey,
            chain,
          });
        }

        return AssetValue.from({ chain });
      }

      case Chain.Bitcoin:
      case Chain.BitcoinCash:
      case Chain.Dogecoin:
      case Chain.Dash:
      case Chain.Litecoin: {
        const { estimateTransactionFee, address: recipient } = getWallet(chain);

        return estimateTransactionFee({ ...params, feeOptionKey, recipient, from: recipient });
      }

      case Chain.THORChain:
      case Chain.Maya:
      case Chain.Kujira:
      case Chain.Cosmos: {
        const { estimateTransactionFee } = await import("@swapkit/toolboxes/cosmos");
        return estimateTransactionFee(params);
      }

      case Chain.Polkadot: {
        const { address, estimateTransactionFee } = getWallet(chain);

        return estimateTransactionFee({ ...params, recipient: address });
      }

      default:
        return baseValue;
    }
  }

  return {
    ...availablePlugins,
    ...connectWalletMethods,

    disconnectAll,
    disconnectChain,
    estimateTransactionFee,
    getAddress,
    getAllWallets,
    getBalance,
    getExplorerAddressUrl: getAddressUrl,
    getExplorerTxUrl: getTxUrl,
    getWallet,
    getWalletWithBalance,

    approveAssetValue,
    isAssetValueApproved,
    signMessage,
    swap,
    transfer,
    verifyMessage,
  };
}
