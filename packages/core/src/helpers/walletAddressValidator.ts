import { Chain } from "@swapkit/helpers";

export async function getAddressValidator() {
  const { cosmosValidateAddress } = await import("@swapkit/toolboxes/cosmos");
  const { evmValidateAddress } = await import("@swapkit/toolboxes/evm");
  const { substrateValidateAddress } = await import("@swapkit/toolboxes/substrate");
  const { utxoValidateAddress } = await import("@swapkit/toolboxes/utxo");
  const { validateAddress: solanaValidateAddress } = await import("@swapkit/toolboxes/solana");
  const { validateAddress: validateRadixAddress } = await import("@swapkit/toolboxes/radix");

  return function validateAddress({ address, chain }: { address: string; chain: Chain }) {
    switch (chain) {
      case Chain.Arbitrum:
      case Chain.Avalanche:
      case Chain.Optimism:
      case Chain.BinanceSmartChain:
      case Chain.Base:
      case Chain.Polygon:
      case Chain.Ethereum:
        return evmValidateAddress({ address });

      case Chain.Litecoin:
      case Chain.Dash:
      case Chain.Dogecoin:
      case Chain.BitcoinCash:
      case Chain.Bitcoin:
        return utxoValidateAddress({ address, chain });

      case Chain.Cosmos:
      case Chain.Kujira:
      case Chain.Maya:
      case Chain.THORChain: {
        return cosmosValidateAddress({ address, chain });
      }

      case Chain.Polkadot: {
        return substrateValidateAddress({ address, chain });
      }

      case Chain.Radix: {
        return validateRadixAddress(address);
      }

      case Chain.Solana: {
        return solanaValidateAddress(address);
      }

      default:
        return false;
    }
  };
}
