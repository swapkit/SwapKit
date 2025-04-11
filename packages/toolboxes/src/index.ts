import {
  Chain,
  type CosmosChain,
  type EVMChain,
  type SubstrateChain,
  type UTXOChain,
} from "@swapkit/helpers";
import type { getCosmosToolbox } from "@swapkit/toolboxes/cosmos";

import type { getEvmToolbox } from "@swapkit/toolboxes/evm";
import type { RadixToolbox } from "@swapkit/toolboxes/radix";
import type { getSolanaToolbox } from "@swapkit/toolboxes/solana";
import type { getSubstrateToolbox } from "@swapkit/toolboxes/substrate";
import type { getUtxoToolbox } from "@swapkit/toolboxes/utxo";

export async function getAddressValidator() {
  const { match } = await import("ts-pattern");
  const { cosmosValidateAddress } = await import("@swapkit/toolboxes/cosmos");
  const { evmValidateAddress } = await import("@swapkit/toolboxes/evm");
  const { substrateValidateAddress } = await import("@swapkit/toolboxes/substrate");
  const { getUTXOAddressValidator } = await import("@swapkit/toolboxes/utxo");
  const { getSolanaAddressValidator } = await import("@swapkit/toolboxes/solana");
  const { validateAddress: validateRadixAddress } = await import("@swapkit/toolboxes/radix");

  const solanaValidateAddress = await getSolanaAddressValidator();
  const utxoValidateAddress = await getUTXOAddressValidator();

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
      .with(Chain.Radix, () => validateRadixAddress(address))
      .with(Chain.Solana, () => solanaValidateAddress(address))
      .with(Chain.Fiat, () => false)
      .exhaustive();

    return isValid;
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
  [Chain.Solana]: Awaited<ReturnType<typeof getSolanaToolbox>>;
};

type ToolboxParams = { [key in EVMChain]: Parameters<typeof getEvmToolbox>[1] } & {
  [key in UTXOChain]: undefined;
} & {
  [key in CosmosChain]: Parameters<typeof getCosmosToolbox>[1];
} & {
  [key in SubstrateChain]: Parameters<typeof getSubstrateToolbox>[1];
} & {
  [Chain.Radix]: Parameters<typeof RadixToolbox>[0];
  [Chain.Solana]: undefined;
};

export async function getToolbox<T extends keyof Toolboxes>(
  chain: T,
  params?: ToolboxParams[T],
): Promise<Toolboxes[T]> {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Optimism:
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Polygon:
    case Chain.Ethereum: {
      const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const evmToolbox = await getEvmToolbox(chain, params as Parameters<typeof getEvmToolbox>[1]);
      return evmToolbox as Toolboxes[T];
    }

    case Chain.Litecoin:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.BitcoinCash:
    case Chain.Bitcoin: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const utxoToolbox = await getUtxoToolbox(chain);
      return utxoToolbox as Toolboxes[T];
    }

    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Maya:
    case Chain.THORChain: {
      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const cosmosToolbox = getCosmosToolbox(
        chain,
        params as Parameters<typeof getCosmosToolbox>[1],
      );

      return cosmosToolbox as Toolboxes[T];
    }

    case Chain.Chainflip:
    case Chain.Polkadot: {
      const { getSubstrateToolbox } = await import("@swapkit/toolboxes/substrate");
      const substrateToolbox = await getSubstrateToolbox(
        chain,
        params as Parameters<typeof getSubstrateToolbox>[1],
      );
      return substrateToolbox as Toolboxes[T];
    }

    case Chain.Radix: {
      const { RadixToolbox } = await import("@swapkit/toolboxes/radix");
      const radixToolbox = await RadixToolbox(params as Parameters<typeof RadixToolbox>[0]);
      return radixToolbox as Toolboxes[T];
    }

    case Chain.Solana: {
      const { getSolanaToolbox } = await import("@swapkit/toolboxes/solana");
      const solanaToolbox = getSolanaToolbox();
      return solanaToolbox as Toolboxes[T];
    }

    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}
