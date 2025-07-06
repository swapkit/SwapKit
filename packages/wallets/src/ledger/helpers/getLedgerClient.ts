import {
  Chain,
  type DerivationPathArray,
  type EVMChain,
  SwapKitError,
  WalletOption,
} from "@swapkit/helpers";

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
import { getNearLedgerClient } from "../clients/near";
import { THORChainLedger } from "../clients/thorchain";
import { TronLedger } from "../clients/tron";
import {
  BitcoinCashLedger,
  BitcoinLedger,
  DashLedger,
  DogecoinLedger,
  LitecoinLedger,
} from "../clients/utxo";
import { XRPLedger } from "../clients/xrp";
import { getLedgerTransport } from "./getLedgerTransport";

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
  [Chain.Near]: Awaited<ReturnType<typeof getNearLedgerClient>>;
  [Chain.Optimism]: ReturnType<typeof OptimismLedger>;
  [Chain.Polygon]: ReturnType<typeof PolygonLedger>;
  [Chain.Ripple]: ReturnType<typeof XRPLedger>;
  [Chain.THORChain]: THORChainLedger;
  [Chain.Tron]: ReturnType<typeof TronLedger>;
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

  return match(chain as LedgerSupportedChain)
    .returnType<Promise<LedgerSignerMap[T]>>()
    .with(Chain.THORChain, () =>
      Promise.resolve(new THORChainLedger(derivationPath) as LedgerSignerMap[T]),
    )
    .with(Chain.Cosmos, () =>
      Promise.resolve(new CosmosLedger(derivationPath) as LedgerSignerMap[T]),
    )
    .with(Chain.Bitcoin, () => Promise.resolve(BitcoinLedger(derivationPath) as LedgerSignerMap[T]))
    .with(Chain.BitcoinCash, () =>
      Promise.resolve(BitcoinCashLedger(derivationPath) as LedgerSignerMap[T]),
    )
    .with(Chain.Dash, () => Promise.resolve(DashLedger(derivationPath) as LedgerSignerMap[T]))
    .with(Chain.Dogecoin, () =>
      Promise.resolve(DogecoinLedger(derivationPath) as LedgerSignerMap[T]),
    )
    .with(Chain.Litecoin, () =>
      Promise.resolve(LitecoinLedger(derivationPath) as LedgerSignerMap[T]),
    )
    .with(Chain.Ripple, () => Promise.resolve(XRPLedger(derivationPath) as LedgerSignerMap[T]))
    .with(Chain.Tron, () => Promise.resolve(TronLedger(derivationPath) as LedgerSignerMap[T]))
    .with(Chain.Near, async () => {
      const transport = await getLedgerTransport();
      return getNearLedgerClient(transport, derivationPath) as unknown as LedgerSignerMap[T];
    })
    .with(
      Chain.Arbitrum,
      Chain.Avalanche,
      Chain.BinanceSmartChain,
      Chain.Ethereum,
      Chain.Optimism,
      Chain.Polygon,
      Chain.Base,
      async () => {
        const { getProvider } = await import("@swapkit/toolboxes/evm");
        const params = { provider: await getProvider(chain as EVMChain), derivationPath };

        return match(chain as Chain)
          .with(
            Chain.BinanceSmartChain,
            () => BinanceSmartChainLedger(params) as LedgerSignerMap[T],
          )
          .with(Chain.Avalanche, () => AvalancheLedger(params) as LedgerSignerMap[T])
          .with(Chain.Arbitrum, () => ArbitrumLedger(params) as LedgerSignerMap[T])
          .with(Chain.Optimism, () => OptimismLedger(params) as LedgerSignerMap[T])
          .with(Chain.Polygon, () => PolygonLedger(params) as LedgerSignerMap[T])
          .with(Chain.Base, () => BaseLedger(params) as LedgerSignerMap[T])
          .otherwise(() => EthereumLedger(params) as LedgerSignerMap[T]);
      },
    )
    .otherwise(() => {
      throw new SwapKitError("wallet_chain_not_supported", { wallet: WalletOption.LEDGER, chain });
    });
};
