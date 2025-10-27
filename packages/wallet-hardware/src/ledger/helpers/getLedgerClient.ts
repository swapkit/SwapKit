import { Chain, type DerivationPathArray, type EVMChain, SwapKitError, WalletOption } from "@swapkit/helpers";

import { CosmosLedger } from "../clients/cosmos";
import {
  ArbitrumLedger,
  AuroraLedger,
  AvalancheLedger,
  BaseLedger,
  BinanceSmartChainLedger,
  EthereumLedger,
  GnosisLedger,
  OptimismLedger,
  PolygonLedger,
  XLayerLedger,
} from "../clients/evm";
import { getNearLedgerClient } from "../clients/near";
import { THORChainLedger } from "../clients/thorchain";
import { TronLedger } from "../clients/tron";
import {
  BitcoinCashLedger,
  BitcoinLedger,
  DashLedger,
  DogecoinLedger,
  LitecoinLedger,
  ZcashLedger,
} from "../clients/utxo";
import { XRPLedger } from "../clients/xrp";

type LedgerSignerMap = {
  [Chain.Arbitrum]: ReturnType<typeof ArbitrumLedger>;
  [Chain.Aurora]: ReturnType<typeof AuroraLedger>;
  [Chain.Avalanche]: ReturnType<typeof AvalancheLedger>;
  [Chain.Base]: ReturnType<typeof BaseLedger>;
  [Chain.BinanceSmartChain]: ReturnType<typeof BinanceSmartChainLedger>;
  [Chain.BitcoinCash]: ReturnType<typeof BitcoinCashLedger>;
  [Chain.Bitcoin]: ReturnType<typeof BitcoinLedger>;
  [Chain.Cosmos]: CosmosLedger;
  [Chain.Dash]: ReturnType<typeof DashLedger>;
  [Chain.Dogecoin]: ReturnType<typeof DogecoinLedger>;
  [Chain.Ethereum]: ReturnType<typeof EthereumLedger>;
  [Chain.Gnosis]: ReturnType<typeof GnosisLedger>;
  [Chain.Litecoin]: ReturnType<typeof LitecoinLedger>;
  [Chain.Near]: ReturnType<typeof getNearLedgerClient>;
  [Chain.Optimism]: ReturnType<typeof OptimismLedger>;
  [Chain.Polygon]: ReturnType<typeof PolygonLedger>;
  [Chain.Ripple]: ReturnType<typeof XRPLedger>;
  [Chain.THORChain]: THORChainLedger;
  [Chain.Tron]: ReturnType<typeof TronLedger>;
  [Chain.XLayer]: ReturnType<typeof XLayerLedger>;
  [Chain.Zcash]: ReturnType<typeof ZcashLedger>;
};

type LedgerSupportedChain = keyof LedgerSignerMap;

export const getLedgerClient = async <T extends LedgerSupportedChain>({
  chain,
  derivationPath,
}: {
  chain: T;
  derivationPath?: DerivationPathArray;
}): Promise<LedgerSignerMap[T]> => {
  const { match } = await import("ts-pattern");

  return (
    match(chain as LedgerSupportedChain)
      .returnType<Promise<LedgerSignerMap[T]>>()
      .with(Chain.THORChain, () => Promise.resolve(new THORChainLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Cosmos, () => Promise.resolve(new CosmosLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Bitcoin, () => Promise.resolve(BitcoinLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.BitcoinCash, () => Promise.resolve(BitcoinCashLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Dash, () => Promise.resolve(DashLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Dogecoin, () => Promise.resolve(DogecoinLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Litecoin, () => Promise.resolve(LitecoinLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Zcash, () => Promise.resolve(ZcashLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Ripple, () => Promise.resolve(XRPLedger(derivationPath) as LedgerSignerMap[T]))
      .with(Chain.Tron, () => Promise.resolve(TronLedger(derivationPath) as LedgerSignerMap[T]))
      // @ts-expect-error
      .with(Chain.Near, () => {
        return Promise.resolve(getNearLedgerClient(derivationPath));
      })
      .with(
        Chain.Arbitrum,
        Chain.Aurora,
        Chain.Avalanche,
        Chain.BinanceSmartChain,
        Chain.Ethereum,
        Chain.Gnosis,
        Chain.Optimism,
        Chain.Polygon,
        Chain.Base,
        Chain.XLayer,
        async () => {
          const { getProvider } = await import("@swapkit/toolboxes/evm");
          const params = { derivationPath, provider: await getProvider(chain as EVMChain) };

          return match(chain as Chain)
            .with(Chain.BinanceSmartChain, () => BinanceSmartChainLedger(params) as LedgerSignerMap[T])
            .with(Chain.Avalanche, () => AvalancheLedger(params) as LedgerSignerMap[T])
            .with(Chain.Arbitrum, () => ArbitrumLedger(params) as LedgerSignerMap[T])
            .with(Chain.Optimism, () => OptimismLedger(params) as LedgerSignerMap[T])
            .with(Chain.Polygon, () => PolygonLedger(params) as LedgerSignerMap[T])
            .with(Chain.Base, () => BaseLedger(params) as LedgerSignerMap[T])
            .with(Chain.Aurora, () => AuroraLedger(params) as LedgerSignerMap[T])
            .with(Chain.Gnosis, () => GnosisLedger(params) as LedgerSignerMap[T])
            .with(Chain.XLayer, () => XLayerLedger(params) as LedgerSignerMap[T])
            .otherwise(() => EthereumLedger(params) as LedgerSignerMap[T]);
        },
      )
      .otherwise(() => {
        throw new SwapKitError("wallet_chain_not_supported", { chain, wallet: WalletOption.LEDGER });
      })
  );
};
