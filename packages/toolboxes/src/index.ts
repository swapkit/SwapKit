import {
  AssetValue,
  Chain,
  type CosmosChain,
  type EVMChain,
  FeeOption,
  type GenericCreateTransactionParams,
  type SubstrateChain,
  SwapKitError,
  type UTXOChain,
} from "@swapkit/helpers";
import type { getCosmosToolbox } from "@swapkit/toolboxes/cosmos";

import type { ETHToolbox, EVMCreateTransactionParams, getEvmToolbox } from "@swapkit/toolboxes/evm";
import type { getNearToolbox } from "@swapkit/toolboxes/near";
import type { RadixToolbox } from "@swapkit/toolboxes/radix";
import type { getRippleToolbox } from "@swapkit/toolboxes/ripple";
import type { SolanaCreateTransactionParams, getSolanaToolbox } from "@swapkit/toolboxes/solana";
import type { getSubstrateToolbox } from "@swapkit/toolboxes/substrate";
import type { createTronToolbox } from "@swapkit/toolboxes/tron";
import type { getUtxoToolbox } from "@swapkit/toolboxes/utxo";

export async function getAddressValidator() {
  const { match } = await import("ts-pattern");
  const { cosmosValidateAddress } = await import("@swapkit/toolboxes/cosmos");
  const { evmValidateAddress } = await import("@swapkit/toolboxes/evm");
  const { substrateValidateAddress } = await import("@swapkit/toolboxes/substrate");
  const { getUTXOAddressValidator } = await import("@swapkit/toolboxes/utxo");
  const { getSolanaAddressValidator } = await import("@swapkit/toolboxes/solana");
  const { validateNearAddress } = await import("@swapkit/toolboxes/near");
  const { rippleValidateAddress } = await import("@swapkit/toolboxes/ripple");
  const { radixValidateAddress } = await import("@swapkit/toolboxes/radix");
  const { getTronAddressValidator } = await import("@swapkit/toolboxes/tron");

  const solanaValidateAddress = await getSolanaAddressValidator();
  const utxoValidateAddress = await getUTXOAddressValidator();
  const tronValidateAddress = await getTronAddressValidator();

  return function validateAddress({ address, chain }: { address: string; chain: Chain }) {
    const isValid = match(chain)
      .with(
        Chain.Arbitrum,
        Chain.Avalanche,
        Chain.Optimism,
        Chain.BinanceSmartChain,
        Chain.Base,
        Chain.Polygon,
        Chain.Ethereum,
        () => evmValidateAddress({ address }),
      )
      .with(Chain.Litecoin, Chain.Dash, Chain.Dogecoin, Chain.BitcoinCash, Chain.Bitcoin, () =>
        utxoValidateAddress({ address, chain: chain as UTXOChain }),
      )
      .with(Chain.Cosmos, Chain.Kujira, Chain.Maya, Chain.THORChain, () =>
        cosmosValidateAddress({ address, chain: chain as CosmosChain }),
      )
      .with(Chain.Chainflip, Chain.Polkadot, () =>
        substrateValidateAddress({ address, chain: chain as SubstrateChain }),
      )
      .with(Chain.Radix, () => radixValidateAddress(address))
      .with(Chain.Near, () => validateNearAddress(address))
      .with(Chain.Ripple, () => rippleValidateAddress(address))
      .with(Chain.Solana, () => solanaValidateAddress(address))
      .with(Chain.Tron, () => tronValidateAddress(address))
      .otherwise(() => false);

    return isValid;
  };
}

export function getFeeEstimator<T extends keyof CreateTransactionParams>(chain: T) {
  return async function estimateFee(params: CreateTransactionParams[T]) {
    const { match } = await import("ts-pattern");

    return match(chain as Chain)
      .returnType<Promise<AssetValue>>()
      .with(
        Chain.Arbitrum,
        Chain.Avalanche,
        Chain.Optimism,
        Chain.BinanceSmartChain,
        Chain.Base,
        Chain.Polygon,
        Chain.Ethereum,
        async (chain) => {
          const toolbox = await getToolbox(chain);
          const txObject = await toolbox.createTransaction(params);

          return (toolbox as Awaited<ReturnType<typeof ETHToolbox>>).estimateTransactionFee({
            ...txObject,
            feeOption: params.feeOptionKey || FeeOption.Fast,
            chain,
          });
        },
      )
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
        async (chain) => {
          const toolbox = await getToolbox(chain);
          return toolbox.estimateTransactionFee(params) as Promise<AssetValue>;
        },
      )
      .with(Chain.THORChain, Chain.Maya, Chain.Kujira, Chain.Cosmos, async () => {
        const { estimateTransactionFee } = await import("@swapkit/toolboxes/cosmos");
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
  [Chain.Tron]: Awaited<ReturnType<typeof createTronToolbox>>;
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
  [Chain.Tron]: Parameters<typeof createTronToolbox>[0];
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
  [Chain.Tron]: GenericCreateTransactionParams;
};

export async function getToolbox<T extends keyof Toolboxes>(
  chain: T,
  params?: ToolboxParams[T],
): Promise<Toolboxes[T]> {
  const { match } = await import("ts-pattern");

  return match(chain as Chain)
    .returnType<Promise<Toolboxes[T]>>()
    .with(
      Chain.Arbitrum,
      Chain.Avalanche,
      Chain.Optimism,
      Chain.BinanceSmartChain,
      Chain.Base,
      Chain.Polygon,
      Chain.Ethereum,
      async () => {
        const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
        const evmToolbox = await getEvmToolbox(
          chain as EVMChain,
          params as Parameters<typeof getEvmToolbox>[1],
        );
        return evmToolbox as Toolboxes[T];
      },
    )
    .with(
      Chain.Litecoin,
      Chain.Dash,
      Chain.Dogecoin,
      Chain.BitcoinCash,
      Chain.Bitcoin,
      async () => {
        const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
        const utxoToolbox = await getUtxoToolbox(
          chain as UTXOChain,
          params as Parameters<typeof getUtxoToolbox>[1],
        );
        return utxoToolbox as Toolboxes[T];
      },
    )
    .with(Chain.Cosmos, Chain.Kujira, Chain.Maya, Chain.THORChain, async () => {
      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const cosmosToolbox = await getCosmosToolbox(
        chain as CosmosChain,
        params as Parameters<typeof getCosmosToolbox>[1],
      );
      return cosmosToolbox as Toolboxes[T];
    })
    .with(Chain.Chainflip, Chain.Polkadot, async () => {
      const { getSubstrateToolbox } = await import("@swapkit/toolboxes/substrate");
      const substrateToolbox = await getSubstrateToolbox(
        chain as SubstrateChain,
        params as Parameters<typeof getSubstrateToolbox>[1],
      );
      return substrateToolbox as Toolboxes[T];
    })
    .with(Chain.Radix, async () => {
      const { RadixToolbox } = await import("@swapkit/toolboxes/radix");
      const radixToolbox = await RadixToolbox(params as Parameters<typeof RadixToolbox>[0]);
      return radixToolbox as Toolboxes[T];
    })
    .with(Chain.Ripple, async () => {
      const { getRippleToolbox } = await import("@swapkit/toolboxes/ripple");
      const rippleToolbox = await getRippleToolbox(
        params as Parameters<typeof getRippleToolbox>[0],
      );
      return rippleToolbox as Toolboxes[T];
    })
    .with(Chain.Solana, async () => {
      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const solanaToolbox = await getSolanaToolbox(
        params as Parameters<typeof getSolanaToolbox>[0],
      );
      return solanaToolbox as Toolboxes[T];
    })
    .with(Chain.Tron, async () => {
      const { createTronToolbox } = await import("@swapkit/toolboxes/tron");
      const tronToolbox = await createTronToolbox(params);
      return tronToolbox as Toolboxes[T];
    })
    .with(Chain.Near, async () => {
      const { getNearToolbox } = await import("@swapkit/toolboxes/near");
      const nearToolbox = await getNearToolbox(params as Parameters<typeof getNearToolbox>[0]);
      return nearToolbox as Toolboxes[T];
    })
    .otherwise(() => {
      throw new SwapKitError("toolbox_not_supported", { chain });
    });
}
