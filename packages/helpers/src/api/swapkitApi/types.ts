import {
  type AssetValue,
  Chain,
  ChainId,
  ErrorCode,
  FeeTypeEnum,
  ProviderName,
  WarningCodeEnum,
} from "@swapkit/helpers";
import {
  type ZodType,
  array,
  boolean,
  nativeEnum,
  number,
  object,
  optional,
  string,
  union,
  unknown,
  type z,
} from "zod";

export enum PriorityLabel {
  CHEAPEST = "CHEAPEST",
  FASTEST = "FASTEST",
  RECOMMENDED = "RECOMMENDED",
}

export enum RouteQuoteTxType {
  PSBT = "PSBT",
  EVM = "EVM",
  COSMOS = "COSMOS",
  RADIX = "RADIX",
}

export enum TxnType {
  native_send = "native_send", // native send, msgSend, etc.
  token_transfer = "token_transfer", // token transfer
  native_contract_call = "native_contract_call", // native contract call
  token_contract_call = "token_contract_call", // token contract call
  approve = "approve", // token approve
  deposit = "deposit", // msgDeposit and related cosmos operations, not deposit to vault or deposit contract name
  thorname_action = "thorname_action", // should we use this or msgDeposit?
  lp_action = "lp_action", // deposit to an evm pool, tc pool, etc.
  swap = "swap", // any kind of operations that involves swapping assets
  streaming_swap = "streaming_swap", // streaming swap
  stake = "stake", // defi operations like $vthor and other types of staking
  claim = "claim", // claim rewards, claim tokens, etc.
  lending = "lending", // lending operations
  unknown = "unknown",
}

// transaction status devoid of any business logic
export enum TxnStatus {
  unknown = "unknown",
  not_started = "not_started",
  pending = "pending",
  swappping = "swapping",
  completed = "completed",
}

export enum TrackingStatus {
  not_started = "not_started",
  starting = "starting", // first status once we receive, old or new transaction
  broadcasted = "broadcasted",
  mempool = "mempool", // or indexing
  inbound = "inbound",
  outbound = "outbound",
  swapping = "swapping", // more generic than streaming
  completed = "completed",
  refunded = "refunded",
  partially_refunded = "partially_refunded",
  dropped = "dropped",
  reverted = "reverted",
  replaced = "replaced",
  retries_exceeded = "retries_exceeded",
  parsing_error = "parsing_error",
}

type TokenProviderVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type TokenListProvidersResponse = Array<{
  provider: ProviderName;
  name: string;
  timestamp: string;
  version: TokenProviderVersion;
  keywords: string[];
  count: number;
  url: string;
}>;

export type TokensResponseV2 = {
  chainId: ChainId;
  count: number;
  keywords: string[];
  name: string;
  provider: ProviderName;
  timestamp: string;
  tokens: TokenV2[];
  version: TokenProviderVersion;
};

export type TokenV2 = {
  address?: string;
  chain: string;
  shortCode?: string;
  chainId: string;
  decimals: number;
  extensions?: {};
  identifier: string;
  logoURI: string;
  name?: string;
  symbol: string;
  ticker: string;
};

export interface TransactionProps {
  chainId: ChainId;
  hash: string;
  block: number;
  type?: TxnType;
  status?: TxnStatus;
  trackingStatus?: TrackingStatus;
  fromAsset: AssetValue | null;
  fromAddress: string;
  toAsset: AssetValue | null;
  toAddress: string;
  finalisedAt?: number;
  meta?: Partial<TxnMeta>;
  payload?: Partial<TxnPayload>;
}

export type TrackerParams = {
  chainId: ChainId;
  hash: string;
  block?: number;
};

export type TrackerResponse = TransactionProps & {
  legs: TransactionLegDTO[];
  transient?: TxnTransient;
};

export const ApiV2ErrorSchema = object({
  error: string(),
  message: string(),
});

export const AssetValueSchema = object({
  chain: nativeEnum(Chain),
  symbol: string(),
  ticker: string(),
  decimal: optional(number()),
  address: optional(string()),
  isGasAsset: boolean(),
  isSynthetic: boolean(),
  tax: optional(
    object({
      buy: number(),
      sell: number(),
    }),
  ),
});

export const TokenDetailsMetadataSchema = object({
  name: string(),
  id: string(),
  market_cap: number(),
  total_volume: number(),
  price_change_24h_usd: number(),
  price_change_percentage_24h_usd: number(),
  timestamp: string(),
  sparkline_in_7d: array(number()),
});

export const PriceResponseSchema = array(
  object({
    identifier: string(),
    provider: string(),
    cg: TokenDetailsMetadataSchema.optional(),
    price_usd: number(),
    timestamp: number(),
  }).partial(),
);

export type PriceResponse = z.infer<typeof PriceResponseSchema>;

export const QuoteRequestSchema = object({
  sellAsset: string({
    description: "Asset to sell",
  }),
  buyAsset: string({
    description: "Asset to buy",
  }),
  sellAmount: string({
    description: "Amount of asset to sell",
  }).refine((amount) => +amount > 0, {
    message: "sellAmount must be greater than 0",
    path: ["sellAmount"],
  }),
  providers: optional(
    array(
      string({
        description: "List of providers to use",
      }).refine(
        (provider) => {
          return ProviderName[provider as ProviderName] !== undefined;
        },
        {
          message: "Invalid provider",
          path: ["providers"],
        },
      ),
    ),
  ),
  sourceAddress: optional(
    string({
      description: "Address to send asset from",
    }),
  ),
  destinationAddress: optional(
    string({
      description: "Address to send asset to",
    }),
  ),
  slippage: optional(
    number({
      description: "Slippage tolerance as a percentage. Default is 3%.",
    }),
  ),
  affiliate: optional(
    string({
      description: "Affiliate thorname",
    }),
  ),
  affiliateFee: optional(
    number({
      description: "Affiliate fee in basis points",
    }).refine(
      (fee) => {
        return fee === Math.floor(fee) && fee >= 0;
      },
      {
        message: "affiliateFee must be a positive integer",
        path: ["affiliateFee"],
      },
    ),
  ),
  allowSmartContractSender: optional(
    boolean({
      description: "Allow smart contract as sender",
    }),
  ),
  allowSmartContractReceiver: optional(
    boolean({
      description: "Allow smart contract as recipient",
    }),
  ),
  disableSecurityChecks: optional(
    boolean({
      description: "Disable security checks",
    }),
  ),
  includeTx: optional(
    boolean({
      description: "Set to true to include an transaction object (EVM only)",
    }),
  ),
  cfBoost: optional(
    boolean({
      description: "Set to true to enable CF boost to speed up Chainflip swaps. BTC only.",
    }),
  ),
  referrer: optional(
    string({
      description: "Referrer address (referral program)",
    }),
  ),
}).refine((data) => data.sellAsset !== data.buyAsset, {
  message: "Must be different",
  path: ["sellAsset", "buyAsset"],
});

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const PriceRequestSchema = object({
  tokens: array(
    object({
      identifier: string(),
    }),
  ),
  metadata: boolean(),
});

export type PriceRequest = z.infer<typeof PriceRequestSchema>;

export const BrokerDepositChannelParamsSchema = object({
  sellAsset: object({
    chain: string(), // identifier of the asset
    asset: string(), // identifier of the asset
  }),
  buyAsset: object({
    chain: string(), // identifier of the asset
    asset: string(), // identifier of the asset
  }),
  destinationAddress: string(),
  channelMetadata: object({
    cfParameters: string().optional(),
    gasBudget: string().optional(),
    message: string().optional(),
  }).optional(),
  affiliateFees: array(
    object({
      brokerAddress: string(),
      feeBps: number(),
    }),
  ).optional(),
  refundParameters: object({
    minPrice: string().optional(),
    refundAddress: string().optional(),
    retryDuration: number().optional(),
  }).optional(),
  dcaParameters: object({
    chunkInterval: number().optional(),
    numberOfChunks: number().optional(),
  }).optional(),
  brokerCommissionBps: number().optional(),
  maxBoostFeeBps: number().optional(),
});

export type BrokerDepositChannelParams = z.infer<typeof BrokerDepositChannelParamsSchema>;

export const DepositChannelResponseSchema = object({
  channelId: string(),
  depositAddress: string(),
});

export type DepositChannelResponse = z.infer<typeof DepositChannelResponseSchema>;

const TxnPayloadSchema = object({
  evmCalldata: optional(string()), // raw 0xcalldata
  logs: optional(unknown()),
  memo: optional(string()),
  spender: optional(string()), // used in evm approve transactions
});

export type TxnPayload = z.infer<typeof TxnPayloadSchema>;

// props that are most important while the transaction is live
const TxnTransientSchema = object({
  estimatedfinalisedAt: number(),
  estimatedTimeToComplete: number(),
  updatedAt: number(),
  currentLegIndex: optional(number()),
  providerDetails: optional(unknown()), // see ProviderTransientDetails
});

export type TxnTransient = z.infer<typeof TxnTransientSchema>;

const TransactionFeesSchema = object({
  network: optional(AssetValueSchema), // gas on ethereum, network fee on thorchain, etc.
  affiliate: optional(AssetValueSchema), // e.g. affiliate in memo, other affiliate mechanisms
  liquidity: optional(AssetValueSchema), // fee paid to pool
  protocol: optional(AssetValueSchema), // extra protocol fees (TS dex aggregation contracts, stargate fees, etc.)
  tax: optional(AssetValueSchema), // taxed tokens
});

export type TransactionFees = z.infer<typeof TransactionFeesSchema>;

// props that are not part of the transaction itself, but are still relevant for integrators
const TxnMetaSchema = object({
  broadcastedAt: optional(number()),
  wallet: optional(string()),
  quoteId: optional(string()),
  explorerUrl: optional(string()),
  affiliate: optional(string()),
  fees: optional(TransactionFeesSchema),
  provider: optional(nativeEnum(ProviderName)),
  images: optional(
    object({
      from: optional(string()),
      to: optional(string()),
      provider: optional(string()),
      chain: optional(string()),
    }),
  ),
});

export type TxnMeta = z.infer<typeof TxnMetaSchema>;

const TransactionLegDTOSchema = object({
  chainId: nativeEnum(ChainId),
  hash: string(),
  block: number(),
  type: nativeEnum(TxnType),
  status: nativeEnum(TxnStatus),
  trackingStatus: optional(nativeEnum(TrackingStatus)),

  fromAsset: string(),
  fromAmount: string(),
  fromAddress: string(),
  toAsset: string(),
  toAmount: string(),
  toAddress: string(),
  finalAsset: optional(AssetValueSchema),
  finalAddress: optional(string()),

  finalisedAt: number(),

  transient: optional(TxnTransientSchema),
  meta: optional(TxnMetaSchema),
  payload: optional(TxnPayloadSchema),
});

export type TransactionLegDTO = z.infer<typeof TransactionLegDTOSchema>;

export const TransactionSchema = TransactionLegDTOSchema.extend({
  legs: array(TransactionLegDTOSchema),
});

export type TransactionDTO = z.infer<typeof TransactionLegDTOSchema> & {
  legs: TransactionLegDTO[];
};

export const TransactionDTOSchema: ZodType<TransactionDTO> = TransactionLegDTOSchema.extend({
  legs: array(TransactionLegDTOSchema),
});

export const FeesSchema = array(
  object({
    type: nativeEnum(FeeTypeEnum),
    amount: string(),
    asset: string(),
    chain: string(),
    protocol: nativeEnum(ProviderName),
  }),
);

export type Fees = z.infer<typeof FeesSchema>;

export const EstimatedTimeSchema = object({
  inbound: optional(
    number({
      description: "Time to receive inbound asset in seconds",
    }),
  ),
  swap: optional(
    number({
      description: "Time to swap assets in seconds",
    }),
  ),
  outbound: optional(
    number({
      description: "Time to receive outbound asset in seconds",
    }),
  ),
  total: number({
    description: "Total time in seconds",
  }),
});

export type EstimatedTime = z.infer<typeof EstimatedTimeSchema>;

export const EVMTransactionSchema = object({
  to: string({
    description: "Address of the recipient",
  }),
  from: string({
    description: "Address of the sender",
  }),
  value: string({
    description: "Value to send",
  }),
  data: string({
    description: "Data to send",
  }),
});

export type EVMTransaction = z.infer<typeof EVMTransactionSchema>;

export const EVMTransactionDetailsParamsSchema = array(
  union([
    string(),
    number(),
    array(string()),

    object({
      from: string(),
      value: string(),
    }).describe("Parameters to pass to the contract method"),
  ]),
);

export type EVMTransactionDetailsParams = z.infer<typeof EVMTransactionDetailsParamsSchema>;

export const EVMTransactionDetailsSchema = object({
  contractAddress: string({
    description: "Address of the contract to interact with",
  }),
  contractMethod: string({
    description: "Name of the method to call",
  }),
  contractParams: EVMTransactionDetailsParamsSchema,
  // contractParamsStreaming: array(
  //   string({
  //     description:
  //       "If making a streaming swap through THORChain, parameters to pass to the contract method",
  //   }),
  // ),
  contractParamNames: array(
    string({
      description: "Names of the parameters to pass to the contract method",
    }),
  ),
  approvalToken: optional(
    string({
      description: "Address of the token to approve spending of",
    }),
  ),
  approvalSpender: optional(
    string({
      description: "Address of the spender to approve",
    }),
  ),
});

export type EVMTransactionDetails = z.infer<typeof EVMTransactionDetailsSchema>;

const EncodeObjectSchema = object({
  typeUrl: string(),
  value: unknown(),
});

const FeeSchema = object({
  amount: array(
    object({
      denom: string(),
      amount: string(),
    }),
  ),
  gas: string(),
});

// Define the full schema
export const CosmosTransactionSchema = object({
  memo: string(),
  accountNumber: number(),
  sequence: number(),
  chainId: nativeEnum(ChainId),
  msgs: array(EncodeObjectSchema),
  fee: FeeSchema,
});

export type CosmosTransaction = z.infer<typeof CosmosTransactionSchema>;

export const RouteLegSchema = object({
  sellAsset: string({
    description: "Asset to sell",
  }),
  buyAsset: string({
    description: "Asset to buy",
  }),
  provider: nativeEnum(ProviderName),
  sourceAddress: string({
    description: "Source address",
  }),
  destinationAddress: string({
    description: "Destination address",
  }),
  estimatedTime: EstimatedTimeSchema.optional(),
  affiliate: string({
    description: "Affiliate address",
  }).optional(),
  affiliateFee: number({
    description: "Affiliate fee",
  }).optional(),
  slipPercentage: number({
    description: "Slippage as a percentage",
  }),
});

export type RouteLeg = z.infer<typeof RouteLegSchema>;

export const RouteLegWithoutAddressesSchema = RouteLegSchema.omit({
  sourceAddress: true,
  destinationAddress: true,
  slipPercentage: true,
});

export type RouteLegWithoutAddresses = z.infer<typeof RouteLegWithoutAddressesSchema>;

export const RouteQuoteMetadataAssetSchema = object({
  asset: string({
    description: "Asset name",
  }),
  price: number({
    description: "Price in USD",
  }),
  image: string({
    description: "Asset image",
  }),
});

export type RouteQuoteMetadataAsset = z.infer<typeof RouteQuoteMetadataAssetSchema>;

export const ChainflipMetadataSchema = BrokerDepositChannelParamsSchema;

export type ChainflipMetadata = z.infer<typeof ChainflipMetadataSchema>;

export const RouteQuoteMetadataSchema = object({
  priceImpact: optional(
    number({
      description: "Price impact",
    }),
  ),
  assets: optional(array(RouteQuoteMetadataAssetSchema)),
  approvalAddress: optional(
    string({
      description: "Approval address for swap",
    }),
  ),
  streamingInterval: number().optional(),
  maxStreamingQuantity: number().optional(),
  tags: array(nativeEnum(PriorityLabel)),

  affiliate: optional(string()),
  affiliateFee: optional(string()),

  txType: optional(nativeEnum(RouteQuoteTxType)),
  chainflip: optional(ChainflipMetadataSchema),
  referrer: optional(string()),
});

export const RouteQuoteWarningSchema = array(
  object({
    code: nativeEnum(WarningCodeEnum),
    display: string(),
    tooltip: string().optional(),
  }),
);

export type RouteQuoteWarning = z.infer<typeof RouteQuoteWarningSchema>;

const QuoteResponseRouteLegItem = object({
  provider: nativeEnum(ProviderName),
  sellAsset: string({
    description: "Asset to sell",
  }),
  sellAmount: string({
    description: "Sell amount",
  }),
  buyAsset: string({
    description: "Asset to buy",
  }),
  buyAmount: string({
    description: "Buy amount",
  }),
  buyAmountMaxSlippage: string({
    description: "Buy amount max slippage",
  }),
  fees: optional(FeesSchema), // TODO remove optionality
});

const QuoteResponseRouteItem = object({
  providers: array(nativeEnum(ProviderName)),
  sellAsset: string({
    description: "Asset to sell",
  }),
  sellAmount: string({
    description: "Sell amount",
  }),
  buyAsset: string({
    description: "Asset to buy",
  }),
  expectedBuyAmount: string({
    description: "Expected Buy amount",
  }),
  expectedBuyAmountMaxSlippage: string({
    description: "Expected Buy amount max slippage",
  }),
  sourceAddress: string({
    description: "Source address",
  }),
  destinationAddress: string({
    description: "Destination address",
  }),
  targetAddress: optional(
    string({
      description: "Target address",
    }),
  ),
  inboundAddress: optional(
    string({
      description: "Inbound address",
    }),
  ),
  expiration: optional(
    string({
      description: "Expiration",
    }),
  ),
  memo: optional(
    string({
      description: "Memo",
    }),
  ),
  fees: FeesSchema,
  txType: optional(nativeEnum(RouteQuoteTxType)),
  tx: optional(union([EVMTransactionSchema, CosmosTransactionSchema, string()])),
  estimatedTime: optional(EstimatedTimeSchema), // TODO remove optionality
  totalSlippageBps: number({
    description: "Total slippage in bps",
  }),
  legs: array(QuoteResponseRouteLegItem),
  warnings: RouteQuoteWarningSchema,
  meta: RouteQuoteMetadataSchema,
});

export const QuoteResponseSchema = object({
  quoteId: string({
    description: "Quote ID",
  }),
  routes: array(QuoteResponseRouteItem),
  // in case of bad request or actual backend error, not bad quotes from providers
  error: optional(
    string({
      description: "Error message",
    }),
  ),
  // errors from providers
  providerErrors: optional(
    array(
      object({
        provider: nativeEnum(ProviderName).optional(),
        errorCode: optional(nativeEnum(ErrorCode)),
        message: optional(string()),
      }),
    ),
  ),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteResponseRoute = z.infer<typeof QuoteResponseRouteItem>;
export type QuoteResponseRouteLeg = z.infer<typeof QuoteResponseRouteLegItem>;

export const GasResponseSchema = array(
  object({
    id: number(),
    chainId: string(),
    value: string(),
    unit: string(),
    createdAt: string(),
  }),
);

export type GasResponse = z.infer<typeof GasResponseSchema>;
