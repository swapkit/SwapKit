import {
  type AssetValue,
  Chain,
  ChainId,
  ErrorCode,
  FeeTypeEnum,
  ProviderName,
  WarningCodeEnum,
} from "@swapkit/helpers";
import { z } from "zod";

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

export const ApiV2ErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export const AssetValueSchema = z.object({
  chain: z.nativeEnum(Chain),
  symbol: z.string(),
  ticker: z.string(),
  decimal: z.optional(z.number()),
  address: z.optional(z.string()),
  isGasAsset: z.boolean(),
  isSynthetic: z.boolean(),
  tax: z.optional(
    z.object({
      buy: z.number(),
      sell: z.number(),
    }),
  ),
});

export const TokenDetailsMetadataSchema = z.object({
  name: z.string(),
  id: z.string(),
  market_cap: z.number(),
  total_volume: z.number(),
  price_change_24h_usd: z.number(),
  price_change_percentage_24h_usd: z.number(),
  timestamp: z.string(),
  sparkline_in_7d: z.array(z.number()),
});

export const PriceResponseSchema = z.array(
  z
    .object({
      identifier: z.string(),
      provider: z.string(),
      cg: TokenDetailsMetadataSchema.optional(),
      price_usd: z.number(),
      timestamp: z.number(),
    })
    .partial(),
);

export type PriceResponse = z.infer<typeof PriceResponseSchema>;

export const QuoteRequestSchema = z
  .object({
    sellAsset: z.string({
      description: "Asset to sell",
    }),
    buyAsset: z.string({
      description: "Asset to buy",
    }),
    sellAmount: z
      .string({
        description: "Amount of asset to sell",
      })
      .refine((amount) => +amount > 0, {
        message: "sellAmount must be greater than 0",
        path: ["sellAmount"],
      }),
    providers: z.optional(
      z.array(
        z
          .string({
            description: "List of providers to use",
          })
          .refine(
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
    sourceAddress: z.optional(
      z.string({
        description: "Address to send asset from",
      }),
    ),
    destinationAddress: z.optional(
      z.string({
        description: "Address to send asset to",
      }),
    ),
    slippage: z.optional(
      z.number({
        description: "Slippage tolerance as a percentage. Default is 3%.",
      }),
    ),
    affiliate: z.optional(
      z.string({
        description: "Affiliate thorname",
      }),
    ),
    affiliateFee: z.optional(
      z
        .number({
          description: "Affiliate fee in basis points",
        })
        .refine(
          (fee) => {
            return fee === Math.floor(fee) && fee >= 0;
          },
          {
            message: "affiliateFee must be a positive integer",
            path: ["affiliateFee"],
          },
        ),
    ),
    allowSmartContractSender: z.optional(
      z.boolean({
        description: "Allow smart contract as sender",
      }),
    ),
    allowSmartContractReceiver: z.optional(
      z.boolean({
        description: "Allow smart contract as recipient",
      }),
    ),
    disableSecurityChecks: z.optional(
      z.boolean({
        description: "Disable security checks",
      }),
    ),
    includeTx: z.optional(
      z.boolean({
        description: "Set to true to include an transaction object (EVM only)",
      }),
    ),
    cfBoost: z.optional(
      z.boolean({
        description: "Set to true to enable CF boost to speed up Chainflip swaps. BTC only.",
      }),
    ),
    referrer: z.optional(
      z.string({
        description: "Referrer address (referral program)",
      }),
    ),
  })
  .refine((data) => data.sellAsset !== data.buyAsset, {
    message: "Must be different",
    path: ["sellAsset", "buyAsset"],
  });

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const PriceRequestSchema = z.object({
  tokens: z.array(
    z.object({
      identifier: z.string(),
    }),
  ),
  metadata: z.boolean(),
});

export type PriceRequest = z.infer<typeof PriceRequestSchema>;

export const DepositChannelRequestSchema = z.object({
  sellAsset: z.string({
    description: "Asset to sell",
  }),
  buyAsset: z.string({
    description: "Asset to buy",
  }),
  recipient: z.string({
    description: "Final recipient of the swap",
  }),
  ccmMetadata: z.optional(
    z.object({
      message: z.string(),
      gasBudget: z.string(),
      cfParameters: z.string(),
    }),
  ),
  dcaParameters: z.optional(
    z.object({
      chunkIntervalBlocks: z.number(),
      numberOfChunks: z.number(),
    }),
  ),
  maxBoostFeeBps: z.optional(z.number()),
  affiliateFees: z.optional(
    z.array(
      z.object({
        brokerAddress: z.string(),
        basisPoints: z.number(),
      }),
    ),
  ),
  refundParameters: z.optional(
    z.object({
      retryDuration: z.number(),
      refundAddress: z.string(),
      minPrice: z.string(),
    }),
  ),
});

export type DepositChannelRequest = z.infer<typeof DepositChannelRequestSchema>;

export const DepositChannelResponseSchema = z.object({
  channelId: z.string(),
  depositAddress: z.string(),
});

export type DepositChannelResponse = z.infer<typeof DepositChannelResponseSchema>;

const TxnPayloadSchema = z.object({
  evmCalldata: z.optional(z.string()), // raw 0xcalldata
  logs: z.optional(z.unknown()),
  memo: z.optional(z.string()),
  spender: z.optional(z.string()), // used in evm approve transactions
});

export type TxnPayload = z.infer<typeof TxnPayloadSchema>;

// props that are most important while the transaction is live
const TxnTransientSchema = z.object({
  estimatedfinalisedAt: z.number(),
  estimatedTimeToComplete: z.number(),
  updatedAt: z.number(),
  currentLegIndex: z.optional(z.number()),
  providerDetails: z.optional(z.unknown()), // see ProviderTransientDetails
});

export type TxnTransient = z.infer<typeof TxnTransientSchema>;

const TransactionFeesSchema = z.object({
  network: z.optional(AssetValueSchema), // gas on ethereum, network fee on thorchain, etc.
  affiliate: z.optional(AssetValueSchema), // e.g. affiliate in memo, other affiliate mechanisms
  liquidity: z.optional(AssetValueSchema), // fee paid to pool
  protocol: z.optional(AssetValueSchema), // extra protocol fees (TS dex aggregation contracts, stargate fees, etc.)
  tax: z.optional(AssetValueSchema), // taxed tokens
});

export type TransactionFees = z.infer<typeof TransactionFeesSchema>;

// props that are not part of the transaction itself, but are still relevant for integrators
const TxnMetaSchema = z.object({
  broadcastedAt: z.optional(z.number()),
  wallet: z.optional(z.string()),
  quoteId: z.optional(z.string()),
  explorerUrl: z.optional(z.string()),
  affiliate: z.optional(z.string()),
  fees: z.optional(TransactionFeesSchema),
  provider: z.optional(z.nativeEnum(ProviderName)),
  images: z.optional(
    z.object({
      from: z.optional(z.string()),
      to: z.optional(z.string()),
      provider: z.optional(z.string()),
      chain: z.optional(z.string()),
    }),
  ),
});

export type TxnMeta = z.infer<typeof TxnMetaSchema>;

const TransactionLegDTOSchema = z.object({
  chainId: z.nativeEnum(ChainId),
  hash: z.string(),
  block: z.number(),
  type: z.nativeEnum(TxnType),
  status: z.nativeEnum(TxnStatus),
  trackingStatus: z.optional(z.nativeEnum(TrackingStatus)),

  fromAsset: z.string(),
  fromAmount: z.string(),
  fromAddress: z.string(),
  toAsset: z.string(),
  toAmount: z.string(),
  toAddress: z.string(),
  finalAsset: z.optional(AssetValueSchema),
  finalAddress: z.optional(z.string()),

  finalisedAt: z.number(),

  transient: z.optional(TxnTransientSchema),
  meta: z.optional(TxnMetaSchema),
  payload: z.optional(TxnPayloadSchema),
});

export type TransactionLegDTO = z.infer<typeof TransactionLegDTOSchema>;

export const TransactionSchema = TransactionLegDTOSchema.extend({
  legs: z.array(TransactionLegDTOSchema),
});

export type TransactionDTO = z.infer<typeof TransactionLegDTOSchema> & {
  legs: TransactionLegDTO[];
};

export const TransactionDTOSchema: z.ZodType<TransactionDTO> = TransactionLegDTOSchema.extend({
  legs: z.array(TransactionLegDTOSchema),
});

export const FeesSchema = z.array(
  z.object({
    type: z.nativeEnum(FeeTypeEnum),
    amount: z.string(),
    asset: z.string(),
    chain: z.string(),
    protocol: z.nativeEnum(ProviderName),
  }),
);

export type Fees = z.infer<typeof FeesSchema>;

export const EstimatedTimeSchema = z.object({
  inbound: z.optional(
    z.number({
      description: "Time to receive inbound asset in seconds",
    }),
  ),
  swap: z.optional(
    z.number({
      description: "Time to swap assets in seconds",
    }),
  ),
  outbound: z.optional(
    z.number({
      description: "Time to receive outbound asset in seconds",
    }),
  ),
  total: z.number({
    description: "Total time in seconds",
  }),
});

export type EstimatedTime = z.infer<typeof EstimatedTimeSchema>;

export const EVMTransactionSchema = z.object({
  to: z.string({
    description: "Address of the recipient",
  }),
  from: z.string({
    description: "Address of the sender",
  }),
  value: z.string({
    description: "Value to send",
  }),
  data: z.string({
    description: "Data to send",
  }),
});

export type EVMTransaction = z.infer<typeof EVMTransactionSchema>;

export const EVMTransactionDetailsParamsSchema = z.array(
  z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z
      .object({
        from: z.string(),
        value: z.string(),
      })
      .describe("Parameters to pass to the contract method"),
  ]),
);

export type EVMTransactionDetailsParams = z.infer<typeof EVMTransactionDetailsParamsSchema>;

export const EVMTransactionDetailsSchema = z.object({
  contractAddress: z.string({
    description: "Address of the contract to interact with",
  }),
  contractMethod: z.string({
    description: "Name of the method to call",
  }),
  contractParams: EVMTransactionDetailsParamsSchema,
  // contractParamsStreaming: z.array(
  //   z.string({
  //     description:
  //       "If making a streaming swap through THORChain, parameters to pass to the contract method",
  //   }),
  // ),
  contractParamNames: z.array(
    z.string({
      description: "Names of the parameters to pass to the contract method",
    }),
  ),
  approvalToken: z.optional(
    z.string({
      description: "Address of the token to approve spending of",
    }),
  ),
  approvalSpender: z.optional(
    z.string({
      description: "Address of the spender to approve",
    }),
  ),
});

export type EVMTransactionDetails = z.infer<typeof EVMTransactionDetailsSchema>;

const EncodeObjectSchema = z.object({
  typeUrl: z.string(),
  value: z.unknown(),
});

const FeeSchema = z.object({
  amount: z.array(
    z.object({
      denom: z.string(),
      amount: z.string(),
    }),
  ),
  gas: z.string(),
});

// Define the full schema
export const CosmosTransactionSchema = z.object({
  memo: z.string(),
  accountNumber: z.number(),
  sequence: z.number(),
  chainId: z.nativeEnum(ChainId),
  msgs: z.array(EncodeObjectSchema),
  fee: FeeSchema,
});

export type CosmosTransaction = z.infer<typeof CosmosTransactionSchema>;

export const RouteLegSchema = z.object({
  sellAsset: z.string({
    description: "Asset to sell",
  }),
  buyAsset: z.string({
    description: "Asset to buy",
  }),
  provider: z.nativeEnum(ProviderName),
  sourceAddress: z.string({
    description: "Source address",
  }),
  destinationAddress: z.string({
    description: "Destination address",
  }),
  estimatedTime: EstimatedTimeSchema.optional(),
  affiliate: z
    .string({
      description: "Affiliate address",
    })
    .optional(),
  affiliateFee: z
    .number({
      description: "Affiliate fee",
    })
    .optional(),
  slipPercentage: z.number({
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

export const RouteQuoteMetadataAssetSchema = z.object({
  asset: z.string({
    description: "Asset name",
  }),
  price: z.number({
    description: "Price in USD",
  }),
  image: z.string({
    description: "Asset image",
  }),
});

export type RouteQuoteMetadataAsset = z.infer<typeof RouteQuoteMetadataAssetSchema>;

export const ChainflipMetadataSchema = z.object({
  boost: z.optional(z.boolean()),
  maxBoostFeeBps: z.optional(z.number()),
  dcaParams: z.optional(
    z.object({
      chunkIntervalBlocks: z.number(),
      numberOfChunks: z.number(),
    }),
  ),
  killOrFillParams: z.optional(
    z.object({
      refundAddress: z.string(),
      retryDurationBlocks: z.number(),
      slippageTolerancePercent: z.number(),
    }),
  ),
});

export type ChainflipMetadata = z.infer<typeof ChainflipMetadataSchema>;

export const RouteQuoteMetadataSchema = z.object({
  priceImpact: z.optional(
    z.number({
      description: "Price impact",
    }),
  ),
  assets: z.optional(z.array(RouteQuoteMetadataAssetSchema)),
  approvalAddress: z.optional(
    z.string({
      description: "Approval address for swap",
    }),
  ),
  streamingInterval: z.number().optional(),
  maxStreamingQuantity: z.number().optional(),
  tags: z.array(z.nativeEnum(PriorityLabel)),

  affiliate: z.optional(z.string()),
  affiliateFee: z.optional(z.string()),

  txType: z.optional(z.nativeEnum(RouteQuoteTxType)),
  chainflip: z.optional(ChainflipMetadataSchema),
  referrer: z.optional(z.string()),
});

export const RouteQuoteWarningSchema = z.array(
  z.object({
    code: z.nativeEnum(WarningCodeEnum),
    display: z.string(),
    tooltip: z.string().optional(),
  }),
);

export type RouteQuoteWarning = z.infer<typeof RouteQuoteWarningSchema>;

const QuoteResponseRouteLegItem = z.object({
  provider: z.nativeEnum(ProviderName),
  sellAsset: z.string({
    description: "Asset to sell",
  }),
  sellAmount: z.string({
    description: "Sell amount",
  }),
  buyAsset: z.string({
    description: "Asset to buy",
  }),
  buyAmount: z.string({
    description: "Buy amount",
  }),
  buyAmountMaxSlippage: z.string({
    description: "Buy amount max slippage",
  }),
  fees: z.optional(FeesSchema), // TODO remove optionality
});

const QuoteResponseRouteItem = z.object({
  providers: z.array(z.nativeEnum(ProviderName)),
  sellAsset: z.string({
    description: "Asset to sell",
  }),
  sellAmount: z.string({
    description: "Sell amount",
  }),
  buyAsset: z.string({
    description: "Asset to buy",
  }),
  expectedBuyAmount: z.string({
    description: "Expected Buy amount",
  }),
  expectedBuyAmountMaxSlippage: z.string({
    description: "Expected Buy amount max slippage",
  }),
  sourceAddress: z.string({
    description: "Source address",
  }),
  destinationAddress: z.string({
    description: "Destination address",
  }),
  targetAddress: z.optional(
    z.string({
      description: "Target address",
    }),
  ),
  inboundAddress: z.optional(
    z.string({
      description: "Inbound address",
    }),
  ),
  expiration: z.optional(
    z.string({
      description: "Expiration",
    }),
  ),
  memo: z.optional(
    z.string({
      description: "Memo",
    }),
  ),
  fees: FeesSchema,
  txType: z.optional(z.nativeEnum(RouteQuoteTxType)),
  tx: z.optional(z.union([EVMTransactionSchema, CosmosTransactionSchema, z.string()])),
  estimatedTime: z.optional(EstimatedTimeSchema), // TODO remove optionality
  totalSlippageBps: z.number({
    description: "Total slippage in bps",
  }),
  legs: z.array(QuoteResponseRouteLegItem),
  warnings: RouteQuoteWarningSchema,
  meta: RouteQuoteMetadataSchema,
});

export const QuoteResponseSchema = z.object({
  quoteId: z.string({
    description: "Quote ID",
  }),
  routes: z.array(QuoteResponseRouteItem),
  // in case of bad request or actual backend error, not bad quotes from providers
  error: z.optional(
    z.string({
      description: "Error message",
    }),
  ),
  // errors from providers
  providerErrors: z.optional(
    z.array(
      z.object({
        provider: z.nativeEnum(ProviderName).optional(),
        errorCode: z.optional(z.nativeEnum(ErrorCode)),
        message: z.optional(z.string()),
      }),
    ),
  ),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteResponseRoute = z.infer<typeof QuoteResponseRouteItem>;
export type QuoteResponseRouteLeg = z.infer<typeof QuoteResponseRouteLegItem>;

export const GasResponseSchema = z.array(
  z.object({
    id: z.number(),
    chainId: z.string(),
    value: z.string(),
    unit: z.string(),
    createdAt: z.string(),
  }),
);

export type GasResponse = z.infer<typeof GasResponseSchema>;
