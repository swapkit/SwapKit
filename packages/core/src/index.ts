import {
  ApproveMode,
  type ApproveReturnType,
  AssetValue,
  Chain,
  type ChainWallet,
  type ConditionalAssetValueReturn,
  CosmosChains,
  type EVMChain,
  EVMChains,
  type FeeOption,
  type GenericTransferParams,
  ProviderName as PluginNameEnum,
  SKConfig,
  type SKConfigState,
  SwapKitError,
  type SwapParams,
  UTXOChains,
} from "@swapkit/helpers";
import type { EVMTransaction, QuoteResponseRoute } from "@swapkit/helpers/api";
import type { createPlugin } from "@swapkit/plugins";
import type { FullWallet } from "@swapkit/toolboxes";
import type { EVMCreateTransactionParams, EVMTransferParams } from "@swapkit/toolboxes/evm";
import type { createWallet } from "@swapkit/wallets";

export type SwapKitParams<P, W> = { config?: SKConfigState; plugins?: P; wallets?: W };

export function SwapKit<
  Plugins extends ReturnType<typeof createPlugin>,
  Wallets extends ReturnType<typeof createWallet>,
>({ config, plugins, wallets }: { config?: SKConfigState; plugins?: Plugins; wallets?: Wallets } = {}) {
  if (config) {
    SKConfig.set(config);
  }

  type PluginName = keyof Plugins;
  const connectedWallets = {} as FullWallet;
  type ConnectedChains = keyof typeof connectedWallets;
  type ActionType = "transfer" | "approve" | "swap";

  type ActionParams<P extends PluginName> = {
    transfer: EVMTransferParams | (GenericTransferParams & { sender?: string });
    approve: { assetValue: AssetValue; contractAddress: string; feeOptionKey?: FeeOption };
    swap: SwapParams<P, QuoteResponseRoute> & { assetValue: AssetValue };
  };

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

      acc[walletName as keyof Wallets] = connectWallet as ReturnType<Wallets[keyof Wallets]["connectWallet"]>;
      return acc;
    },
    {} as {
      [key in keyof Wallets]: ReturnType<Wallets[key]["connectWallet"]>;
    },
  );

  function getSwapKitPlugin<T extends PluginName>(pluginName?: T) {
    const pluginByName = pluginName && availablePlugins[pluginName];
    const pluginByProvider = Object.values(availablePlugins).find((plugin) =>
      plugin.supportedSwapkitProviders?.includes(pluginName),
    );
    const plugin = pluginByName || pluginByProvider;

    if (!plugin) {
      throw new SwapKitError("core_plugin_not_found");
    }

    return plugin as ReturnType<Plugins[T]>;
  }

  function addChain<T extends Chain>(connectWallet: Omit<ChainWallet<T>, "balance"> & { balance?: AssetValue[] }) {
    const currentWallet = getWallet(connectWallet.chain);

    const balance = connectWallet?.balance ||
      currentWallet?.balance || [AssetValue.from({ chain: connectWallet.chain })];

    const wallet = { ...currentWallet, ...connectWallet, balance } as FullWallet[T];

    connectedWallets[connectWallet.chain] = wallet;

    return wallet;
  }

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
    return connectedWallets[chain];
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

  function getBalance<T extends Chain, R extends boolean>(chain: T, refresh?: R): ConditionalAssetValueReturn<R> {
    return (
      refresh ? getWalletWithBalance(chain).then(({ balance }) => balance) : getWallet(chain)?.balance || []
    ) as ConditionalAssetValueReturn<R>;
  }

  async function getWalletWithBalance<T extends Chain>(chain: T, scamFilter = true) {
    const wallet = getWallet(chain);
    if (!wallet) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }
    const defaultBalance = [AssetValue.from({ chain })];
    wallet.balance = defaultBalance;

    if ("getBalance" in wallet) {
      const balance = await wallet.getBalance(wallet.address, scamFilter);
      wallet.balance = balance;
    }

    return wallet;
  }

  function swap<T extends PluginName>({ route, pluginName, ...rest }: SwapParams<T, QuoteResponseRoute>) {
    const plugin = getSwapKitPlugin(pluginName || route.providers[0]);

    if ("swap" in plugin) {
      // @ts-expect-error TODO: fix this
      return plugin.swap({ ...rest, route });
    }

    throw new SwapKitError("core_plugin_swap_not_found");
  }

  function transfer({ assetValue, ...params }: GenericTransferParams | EVMTransferParams) {
    const chain = assetValue.chain;
    if ([Chain.Radix].includes(chain) || !getWallet(chain)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }
    const wallet = getWallet(chain as Exclude<Chain, typeof Chain.Radix | typeof Chain.Near>);

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
  }: {
    chain: Chain;
    signature: string;
    message: string;
    address: string;
  }) {
    if (chain !== Chain.THORChain) {
      throw new SwapKitError({ errorKey: "core_verify_message_not_supported", info: { chain } });
    }

    const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
    const toolbox = await getCosmosToolbox(chain);

    return toolbox.verifySignature({ address, message, signature });
  }

  async function estimateTransactionFee<P extends PluginName, T extends ActionType>({
    type,
    feeOptionKey,
    params,
  }: {
    type: T;
    params: ActionParams<P>[T];
    feeOptionKey: FeeOption;
  }): Promise<AssetValue | undefined> {
    const { assetValue } = params;
    const { chain } = assetValue;

    if (!getWallet(chain as Chain)) throw new SwapKitError("core_wallet_connection_not_found");

    const baseValue = AssetValue.from({ chain });
    const { match } = await import("ts-pattern");

    return match(chain as Chain)
      .returnType<Promise<AssetValue | undefined> | AssetValue | undefined>()
      .with(...EVMChains, (chain) => {
        const { address, ...wallet } = getWallet(chain);

        const tx = match(type as ActionType)
          .with("transfer", () => wallet.createTransferTx(params as EVMCreateTransactionParams))
          .with("approve", (_t) => {
            const { contractAddress } = params as ActionParams<P>[typeof _t];

            return wallet.createApprovalTx({
              amount: assetValue.getBaseValue("bigint"),
              assetAddress: assetValue.address as string,
              from: address,
              spenderAddress: contractAddress,
            });
          })
          .with("swap", (_t) => {
            const {
              route: {
                providers: [plugin],
                tx,
              },
            } = params as ActionParams<P>[typeof _t];

            if (plugin && [PluginNameEnum.CHAINFLIP, PluginNameEnum.CHAINFLIP_STREAMING].includes(plugin)) {
              return wallet.createTransferTx({ assetValue, recipient: address, sender: address });
            }

            const evmTx = tx as EVMTransaction;

            return { ...evmTx, value: BigInt(evmTx.value) };
          })
          .otherwise(() => undefined);

        if (!tx) return baseValue;

        return wallet.estimateTransactionFee({ ...tx, chain, feeOption: feeOptionKey });
      })
      .with(...UTXOChains, (chain) => {
        const { address, ...wallet } = getWallet(chain);
        return wallet.estimateTransactionFee({ ...params, feeOptionKey, recipient: address, sender: address });
      })
      .with(...CosmosChains, async () => {
        const { estimateTransactionFee } = await import("@swapkit/toolboxes/cosmos");
        return estimateTransactionFee(params);
      })
      .with(Chain.Polkadot, (chain) => {
        const wallet = getWallet(chain);
        return wallet.estimateTransactionFee({ ...params, recipient: wallet.address });
      })
      .with(Chain.Tron, (chain) => {
        const { address, ...wallet } = getWallet(chain);
        return wallet.estimateTransactionFee({ ...params, recipient: address, sender: address });
      })
      .with(Chain.Ripple, (chain) => getWallet(chain).estimateTransactionFee())
      .with(Chain.Ton, (chain) => getWallet(chain).estimateTransactionFee())
      .with(Chain.Cardano, (chain) => getWallet(chain).estimateTransactionFee())
      .with(Chain.Sui, (chain) => getWallet(chain).estimateTransactionFee())
      .otherwise(async () => baseValue);
  }

  return {
    ...availablePlugins,
    ...connectWalletMethods,

    approveAssetValue,

    disconnectAll,
    disconnectChain,
    estimateTransactionFee,
    getAddress,
    getAllWallets,
    getBalance,
    getWallet,
    getWalletWithBalance,
    isAssetValueApproved,
    signMessage,
    swap,
    transfer,
    verifyMessage,
  };
}

export * from "@swapkit/helpers";
