import { Chain, type DerivationPathArray, SwapKitError, WalletOption } from "@swapkit/helpers";

import { CosmosLedger } from "../clients/cosmos";
import {
  ArbitrumLedger,
  AvalancheLedger,
  BaseLedger,
  BinanceSmartChainLedger,
  EthereumLedger,
  OptimismLedger,
  PolygonLedger,
} from "../clients/evm";
import { THORChainLedger } from "../clients/thorchain/index";
import {
  BitcoinCashLedger,
  BitcoinLedger,
  DashLedger,
  DogecoinLedger,
  LitecoinLedger,
} from "../clients/utxo";
import type { LedgerSupportedChain } from "./ledgerSupportedChains";

type LedgerSignerMap = {
  [Chain.Arbitrum]: ReturnType<typeof ArbitrumLedger>;
  [Chain.Avalanche]: ReturnType<typeof AvalancheLedger>;
  [Chain.Base]: ReturnType<typeof BaseLedger>;
  [Chain.BinanceSmartChain]: ReturnType<typeof BinanceSmartChainLedger>;
  [Chain.BitcoinCash]: ReturnType<typeof BitcoinCashLedger>;
  [Chain.Bitcoin]: ReturnType<typeof BitcoinLedger>;
  [Chain.Cosmos]: CosmosLedger;
  [Chain.Dash]: ReturnType<typeof DashLedger>;
  [Chain.Dogecoin]: ReturnType<typeof DogecoinLedger>;
  [Chain.Ethereum]: ReturnType<typeof EthereumLedger>;
  [Chain.Litecoin]: ReturnType<typeof LitecoinLedger>;
  [Chain.Optimism]: ReturnType<typeof OptimismLedger>;
  [Chain.Polygon]: ReturnType<typeof PolygonLedger>;
  [Chain.THORChain]: THORChainLedger;
};

export const getLedgerClient = async <T extends LedgerSupportedChain>({
  chain,
  derivationPath,
}: {
  chain: T;
  derivationPath?: DerivationPathArray;
}): Promise<LedgerSignerMap[T]> => {
  switch (chain) {
    case Chain.THORChain:
      return new THORChainLedger(derivationPath) as LedgerSignerMap[T];
    case Chain.Cosmos:
      return new CosmosLedger(derivationPath) as LedgerSignerMap[T];
    case Chain.Bitcoin:
      return BitcoinLedger(derivationPath) as LedgerSignerMap[T];
    case Chain.BitcoinCash:
      return BitcoinCashLedger(derivationPath) as LedgerSignerMap[T];
    case Chain.Dash:
      return DashLedger(derivationPath) as LedgerSignerMap[T];
    case Chain.Dogecoin:
      return DogecoinLedger(derivationPath) as LedgerSignerMap[T];
    case Chain.Litecoin:
      return LitecoinLedger(derivationPath) as LedgerSignerMap[T];

    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Base: {
      const { getProvider } = await import("@swapkit/toolbox-evm");
      const params = { provider: getProvider(chain), derivationPath };

      switch (chain) {
        case Chain.BinanceSmartChain:
          return BinanceSmartChainLedger(params) as LedgerSignerMap[T];
        case Chain.Avalanche:
          return AvalancheLedger(params) as LedgerSignerMap[T];
        case Chain.Arbitrum:
          return ArbitrumLedger(params) as LedgerSignerMap[T];
        case Chain.Optimism:
          return OptimismLedger(params) as LedgerSignerMap[T];
        case Chain.Polygon:
          return PolygonLedger(params) as LedgerSignerMap[T];
        case Chain.Base:
          return BaseLedger(params) as LedgerSignerMap[T];
        default:
          return EthereumLedger(params) as LedgerSignerMap[T];
      }
    }

    default:
      throw new SwapKitError("wallet_chain_not_supported", { wallet: WalletOption.LEDGER, chain });
  }
};
