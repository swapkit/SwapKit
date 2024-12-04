import type { SupportedKadoChain } from "./helpers";

export const KadoSupportedFiatCurrencies = [
  "USD",
  "CAD",
  "GBP",
  "EUR",
  "MXN",
  "COP",
  "INR",
  "CHF",
  "AUD",
  "ARS",
  "BRL",
  "CLP",
  "JPY",
  "KRW",
  "PEN",
  "PHP",
  "SGD",
  "TRY",
  "UYU",
  "TWD",
  "VND",
  "CRC",
  "SEK",
  "PLN",
  "DKK",
  "NOK",
  "NZD",
] as const;

export type KadoFiatCurrency = (typeof KadoSupportedFiatCurrencies)[number];

export type KadoFiatMethod =
  | "ach"
  | "debit_card"
  | "credit_card"
  | "apple_pay_credit"
  | "apple_pay_debit"
  | "wire"
  | "sepa"
  | "pix"
  | "koywe";

export type KadoQuoteRequest = {
  transactionType: "buy" | "sell";
  fiatMethod: KadoFiatMethod;
  partner: "fortress";
  amount: string;
  asset: string;
  blockchain: string;
  currency: KadoFiatCurrency;
};

export type KadoAsset = {
  _id: string;
  name: string;
  description: string;
  label: string;
  symbol: string;
  supportedProviders: string[];
  stablecoin: boolean;
  liveOnRamp: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  priority: number;
  displayPrecision: number;
  usesAvaxRouter: boolean;
  squidChainId: string;
  coingeckoId: string;
  usesAxelarBridge: boolean;
  squidAssetId: string;
  address: string;
  blockExplorerURI: string;
  decimals: number;
  officialChainId: keyof typeof SupportedKadoChain;
  precision: number;
  rampProducts: string[];
  wallets: string[];
  rpcURI: string;
  usesPolygonFulfillment: boolean;
  usesOsmoRouter: boolean;
  ibcChannelIdOffRamp: number;
  ibcChannelIdOnRamp: number;
  osmoPfmChannel: number;
  osmoPfmReceiver: string;
  ibcDenom: string;
  isNative: boolean;
  avgOffRampTimeInSeconds: number;
  avgOnRampTimeInSeconds: number;
  providers: string[];
  trustekAssetId: string;
  trustekNetworkId: string;
  kycLevels: string[];
};

export type KadoBlockchainsResponse = {
  success: boolean;
  message: string;
  data: {
    blockchains: {
      _id: string;
      supportedEnvironment: string;
      network: string;
      origin: string;
      label: string;
      associatedAssets: KadoAsset[];
      avgTransactionTimeSeconds: number;
      usesAvaxRouter: boolean;
      liveOnRamp: boolean;
      createdAt: string;
      updatedAt: string;
      __v: number;
      priority: number;
    }[];
  };
};

export type KadoSupportedAssetsResponse = {
  success: boolean;
  message: string;
  data: {
    assets: KadoAsset[];
  };
};

export type KadoQuoteResponse = {
  success: boolean;
  message: string;
  data: {
    request: {
      transactionType: string;
      fiatMethod: KadoFiatMethod;
      partner: string;
      amount: number;
      asset: string;
      blockchain: keyof typeof SupportedKadoChain;
      currency: KadoFiatCurrency;
      reverse: false;
      ipCountry: string;
    };
    quote: {
      asset: string;
      baseAmount: {
        amount: number;
        currency: KadoFiatCurrency;
      };
      price: {
        amount: number;
        price: number;
        symbol: string;
        unit: string;
      };
      bridgeFee: {
        amount: number;
        currency: KadoFiatCurrency;
        originalAmount: number;
        promotionModifier: number;
      };
      receiveAmountAfterFees: {
        originalAmount: number;
        amount: number;
        currency: KadoFiatCurrency;
      };
      receiveUnitCountAfterFees: {
        amount: number;
        currency: KadoFiatCurrency;
      };
      feeType: string;
      minValue: {
        amount: number;
        unit: string;
      };
      maxValue: {
        amount: number;
        unit: string;
      };
      receive: {
        amount: number;
        originalAmount: number;
        symbol: string;
        unit: string;
        unitCount: number;
      };
      networkFee: {
        amount: number;
        currency: KadoFiatCurrency;
        originalAmount: number;
        promotionModifier: number;
      };
      processingFee: {
        amount: number;
        currency: KadoFiatCurrency;
        originalAmount: number;
        promotionModifier: number;
      };
      totalFee: {
        amount: number;
        currency: KadoFiatCurrency;
        originalAmount: number;
      };
      smartContractFee: {
        amount: number;
        currency: KadoFiatCurrency;
        originalAmount: number;
        promotionModifier: number;
      };
    };
  };
};
