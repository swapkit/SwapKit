import {
  AssetValue,
  Chain,
  type CosmosChain,
  CosmosChains,
  type EVMChain,
  EVMChains,
  FeeOption,
  type GenericCreateTransactionParams,
  type SubstrateChain,
  SubstrateChains,
  SwapKitError,
  type UTXOChain,
  UTXOChains,
} from "@swapkit/helpers";
import type { getCardanoToolbox } from "./cardano";
import type { getCosmosToolbox } from "./cosmos";
import type { ETHToolbox, EVMCreateTransactionParams, getEvmToolbox } from "./evm";
import type { getNearToolbox } from "./near";
import type { RadixToolbox } from "./radix";
import type { getRippleToolbox } from "./ripple";
import type { getSolanaToolbox, SolanaCreateTransactionParams } from "./solana";
import type { getSubstrateToolbox } from "./substrate";
import type { getSuiToolbox, SuiCreateTransactionParams } from "./sui";
import type { getTONToolbox } from "./ton";
import type { createTronToolbox } from "./tron";
import type { getUtxoToolbox } from "./utxo";

export * from "./types";

export async function getAddressValidator() {
  const { match } = await import("ts-pattern");
  const { evmValidateAddress } = await import("./evm");
  const { getCardanoAddressValidator } = await import("./cardano");
  const { getCosmosValidateAddress } = await import("./cosmos");
  const { getSolanaAddressValidator } = await import("./solana");
  const { getSuiAddressValidator } = await import("./sui");
  const { getTONAddressValidator } = await import("./ton");
  const { getTronAddressValidator } = await import("./tron");
  const { getUTXOAddressValidator } = await import("./utxo");
  const { getValidateNearAddress } = await import("./near");
  const { radixValidateAddress } = await import("./radix");
  const { rippleValidateAddress } = await import("./ripple");
  const { substrateValidateAddress } = await import("./substrate");

  const cardanoValidateAddress = await getCardanoAddressValidator();
  const nearValidateAddress = await getValidateNearAddress();
  const solanaValidateAddress = await getSolanaAddressValidator();
  const suiValidateAddress = await getSuiAddressValidator();
  const tonValidateAddress = await getTONAddressValidator();
  const tronValidateAddress = await getTronAddressValidator();
  const utxoValidateAddress = await getUTXOAddressValidator();

  return function validateAddress({ address, chain }: { address: string; chain: Chain }) {
    const isValid = match(chain)
      .with(...EVMChains, () => evmValidateAddress({ address }))
      .with(...UTXOChains, () => utxoValidateAddress({ address, chain: chain as UTXOChain }))
      .with(Chain.Cosmos, Chain.Kujira, Chain.Noble, Chain.Maya, Chain.THORChain, (chain) => {
        const cosmosValidateAddress = getCosmosValidateAddress(chain);
        return cosmosValidateAddress(address);
      })
      .with(Chain.Chainflip, Chain.Polkadot, () =>
        substrateValidateAddress({ address, chain: chain as SubstrateChain }),
      )
      .with(Chain.Radix, () => radixValidateAddress(address))
      .with(Chain.Near, () => nearValidateAddress(address))
      .with(Chain.Ripple, () => rippleValidateAddress(address))
      .with(Chain.Solana, () => solanaValidateAddress(address))
      .with(Chain.Sui, () => suiValidateAddress(address))
      .with(Chain.Ton, () => tonValidateAddress(address))
      .with(Chain.Tron, () => tronValidateAddress(address))
      .with(Chain.Cardano, () => cardanoValidateAddress(address))
      .otherwise(() => false);

    return isValid;
  };
}

export function getFeeEstimator<T extends keyof CreateTransactionParams>(chain: T) {
  return async function estimateFee(params: CreateTransactionParams[T]) {
    const { match } = await import("ts-pattern");

    return match(chain as Chain)
      .returnType<Promise<AssetValue>>()
      .with(...EVMChains, async (chain) => {
        const toolbox = await getToolbox(chain);
        const txObject = await toolbox.createTransaction(params);

        return (toolbox as Awaited<ReturnType<typeof ETHToolbox>>).estimateTransactionFee({
          ...txObject,
          chain,
          feeOption: params.feeOptionKey || FeeOption.Fast,
        });
      })
      .with(
        Chain.Bitcoin,
        Chain.BitcoinCash,
        Chain.Dogecoin,
        Chain.Dash,
        Chain.Litecoin,
        Chain.Polkadot,
        Chain.Solana,
        Chain.Ripple,
        Chain.Tron,
        Chain.Near,
        Chain.Cardano,
        async (chain) => {
          const toolbox = await getToolbox(chain);
          return toolbox.estimateTransactionFee(params) as Promise<AssetValue>;
        },
      )
      .with(Chain.Sui, async () => {
        const { getSuiToolbox } = await import("./sui");
        const suiToolbox = await getSuiToolbox();
        return suiToolbox.estimateTransactionFee(params as SuiCreateTransactionParams);
      })
      .with(Chain.Ton, async () => {
        const { getTONToolbox } = await import("./ton");
        const tonToolbox = await getTONToolbox();
        return tonToolbox.estimateTransactionFee();
      })
      .with(...CosmosChains, async () => {
        const { estimateTransactionFee } = await import("./cosmos");
        return estimateTransactionFee(params);
      })
      .otherwise(async () => AssetValue.from({ chain }));
  };
}

type Toolboxes = {
  [key in EVMChain]: Awaited<ReturnType<typeof getEvmToolbox>>;
} & {
  [key in UTXOChain]: Awaited<ReturnType<typeof getUtxoToolbox>>;
} & {
  [key in CosmosChain]: Awaited<ReturnType<typeof getCosmosToolbox>>;
} & {
  [key in SubstrateChain]: Awaited<ReturnType<typeof getSubstrateToolbox>>;
} & {
  [Chain.Radix]: Awaited<ReturnType<typeof RadixToolbox>>;
  [Chain.Near]: Awaited<ReturnType<typeof getNearToolbox>>;
  [Chain.Ripple]: Awaited<ReturnType<typeof getRippleToolbox>>;
  [Chain.Solana]: Awaited<ReturnType<typeof getSolanaToolbox>>;
  [Chain.Sui]: Awaited<ReturnType<typeof getSuiToolbox>>;
  [Chain.Ton]: Awaited<ReturnType<typeof getTONToolbox>>;
  [Chain.Tron]: Awaited<ReturnType<typeof createTronToolbox>>;
  [Chain.Cardano]: Awaited<ReturnType<typeof getCardanoToolbox>>;
};

type ToolboxParams = { [key in EVMChain]: Parameters<typeof getEvmToolbox>[1] } & {
  [key in UTXOChain]: undefined;
} & {
  [key in CosmosChain]: Parameters<typeof getCosmosToolbox>[1];
} & {
  [key in SubstrateChain]: Parameters<typeof getSubstrateToolbox>[1];
} & {
  [Chain.Radix]: Parameters<typeof RadixToolbox>[0];
  [Chain.Near]: Parameters<typeof getNearToolbox>[0];
  [Chain.Ripple]: Parameters<typeof getRippleToolbox>[0];
  [Chain.Solana]: Parameters<typeof getSolanaToolbox>[0];
  [Chain.Sui]: Parameters<typeof getSuiToolbox>[0];
  [Chain.Ton]: Parameters<typeof getTONToolbox>[0];
  [Chain.Tron]: Parameters<typeof createTronToolbox>[0];
  [Chain.Cardano]: Parameters<typeof getCardanoToolbox>[0];
};

type CreateTransactionParams = { [key in EVMChain]: EVMCreateTransactionParams } & {
  [key in UTXOChain]: GenericCreateTransactionParams;
} & {
  [key in CosmosChain]: GenericCreateTransactionParams;
} & {
  [key in SubstrateChain]: GenericCreateTransactionParams;
} & {
  [Chain.Radix]: GenericCreateTransactionParams;
  [Chain.Ripple]: GenericCreateTransactionParams;
  [Chain.Near]: GenericCreateTransactionParams;
  [Chain.Solana]: SolanaCreateTransactionParams;
  [Chain.Sui]: SuiCreateTransactionParams;
  [Chain.Ton]: GenericCreateTransactionParams;
  [Chain.Tron]: GenericCreateTransactionParams;
  [Chain.Cardano]: GenericCreateTransactionParams;
};

export async function getToolbox<T extends keyof Toolboxes>(
  chain: T,
  params?: ToolboxParams[T],
): Promise<Toolboxes[T]> {
  const { match } = await import("ts-pattern");

  return match(chain as Chain)
    .returnType<Promise<Toolboxes[T]>>()
    .with(...EVMChains, async () => {
      const { getEvmToolbox } = await import("./evm/toolbox");
      const evmToolbox = await getEvmToolbox(chain as EVMChain, params as Parameters<typeof getEvmToolbox>[1]);
      return evmToolbox as Toolboxes[T];
    })
    .with(...UTXOChains, async () => {
      const { getUtxoToolbox } = await import("./utxo");
      const utxoToolbox = await getUtxoToolbox(chain as UTXOChain, params as Parameters<typeof getUtxoToolbox>[1]);
      return utxoToolbox as Toolboxes[T];
    })
    .with(...CosmosChains, async () => {
      const { getCosmosToolbox } = await import("./cosmos");
      const cosmosToolbox = await getCosmosToolbox(
        chain as Exclude<CosmosChain, Chain.Harbor>,
        params as Parameters<typeof getCosmosToolbox>[1],
      );
      return cosmosToolbox as Toolboxes[T];
    })
    .with(...SubstrateChains, async () => {
      const { getSubstrateToolbox } = await import("./substrate");
      const substrateToolbox = await getSubstrateToolbox(
        chain as SubstrateChain,
        params as Parameters<typeof getSubstrateToolbox>[1],
      );
      return substrateToolbox as Toolboxes[T];
    })
    .with(Chain.Radix, async () => {
      const { RadixToolbox } = await import("./radix");
      const radixToolbox = await RadixToolbox(params as Parameters<typeof RadixToolbox>[0]);
      return radixToolbox as Toolboxes[T];
    })
    .with(Chain.Ripple, async () => {
      const { getRippleToolbox } = await import("./ripple");
      const rippleToolbox = await getRippleToolbox(params as Parameters<typeof getRippleToolbox>[0]);
      return rippleToolbox as Toolboxes[T];
    })
    .with(Chain.Solana, async () => {
      const { getSolanaToolbox } = await import("./solana");
      const solanaToolbox = await getSolanaToolbox(params as Parameters<typeof getSolanaToolbox>[0]);
      return solanaToolbox as Toolboxes[T];
    })
    .with(Chain.Sui, async () => {
      const { getSuiToolbox } = await import("./sui");
      const suiToolbox = await getSuiToolbox(params as Parameters<typeof getSuiToolbox>[0]);
      return suiToolbox as Toolboxes[T];
    })
    .with(Chain.Tron, async () => {
      const { createTronToolbox } = await import("./tron");
      const tronToolbox = await createTronToolbox(params as Parameters<typeof createTronToolbox>[0]);
      return tronToolbox as Toolboxes[T];
    })
    .with(Chain.Near, async () => {
      const { getNearToolbox } = await import("./near");
      const nearToolbox = await getNearToolbox(params as Parameters<typeof getNearToolbox>[0]);
      return nearToolbox as Toolboxes[T];
    })
    .with(Chain.Cardano, async () => {
      const { getCardanoToolbox } = await import("./cardano");
      const cardanoToolbox = await getCardanoToolbox(params as Parameters<typeof getCardanoToolbox>[0]);
      return cardanoToolbox as Toolboxes[T];
    })
    .with(Chain.Ton, async () => {
      const { getTONToolbox } = await import("./ton");
      const tonToolbox = await getTONToolbox(params as Parameters<typeof getTONToolbox>[0]);
      return tonToolbox as Toolboxes[T];
    })
    .otherwise(() => {
      throw new SwapKitError("toolbox_not_supported", { chain });
    });
}
