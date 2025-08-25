import type { CosmosLedger } from "./clients/cosmos";
import type {
  ArbitrumLedger,
  AuroraLedger,
  AvalancheLedger,
  BaseLedger,
  BinanceSmartChainLedger,
  EthereumLedger,
  GnosisLedger,
  OptimismLedger,
  PolygonLedger,
} from "./clients/evm";
import type { THORChainLedger } from "./clients/thorchain";
import type { TronLedger } from "./clients/tron";
import type { BitcoinCashLedger, BitcoinLedger, DogecoinLedger, LitecoinLedger } from "./clients/utxo";

export type UTXOLedgerClients =
  | ReturnType<typeof BitcoinLedger>
  | ReturnType<typeof BitcoinCashLedger>
  | ReturnType<typeof DogecoinLedger>
  | ReturnType<typeof LitecoinLedger>;
export type CosmosLedgerClients = CosmosLedger | THORChainLedger;
export type EVMLedgerClients =
  | ReturnType<typeof ArbitrumLedger>
  | ReturnType<typeof AuroraLedger>
  | ReturnType<typeof AvalancheLedger>
  | ReturnType<typeof BaseLedger>
  | ReturnType<typeof BinanceSmartChainLedger>
  | ReturnType<typeof GnosisLedger>
  | ReturnType<typeof EthereumLedger>
  | ReturnType<typeof OptimismLedger>
  | ReturnType<typeof PolygonLedger>;
export type TronLedgerClient = ReturnType<typeof TronLedger>;

export type GetAddressAndPubKeyResponse = {
  bech32_address: string;
  compressed_pk: any;
  error_message: string;
  return_code: number;
};
