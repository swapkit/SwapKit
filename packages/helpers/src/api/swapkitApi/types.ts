import { ErrorCode, FeeTypeEnum, ProviderName, WarningCodeEnum } from "@swapkit/helpers";
import { Chain, ChainId } from "@swapkit/types";
import { array, boolean, coerce, number, object, optional, string, union, unknown, type ZodType, z } from "zod/v4";

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
  native_send = "native_send",
  token_transfer = "token_transfer",
  native_contract_call = "native_contract_call",
  token_contract_call = "token_contract_call",
  approve = "approve",
  deposit = "deposit",
  thorname_action = "thorname_action",
  lp_action = "lp_action",
  swap = "swap",
  streaming_swap = "streaming_swap",
  stake = "stake",
  claim = "claim",
  lending = "lending",
  unknown = "unknown",
}

export enum TxnStatus {
  unknown = "unknown",
  not_started = "not_started",
  pending = "pending",
  swapping = "swapping",
  completed = "completed",
}

export enum TrackingStatus {
  not_started = "not_started",
  starting = "starting",
  broadcasted = "broadcasted",
  mempool = "mempool",
  inbound = "inbound",
  outbound = "outbound",
  swapping = "swapping",
  completed = "completed",
  refunded = "refunded",
  partially_refunded = "partially_refunded",
  dropped = "dropped",
  reverted = "reverted",
  replaced = "replaced",
  retries_exceeded = "retries_exceeded",
  parsing_error = "parsing_error",
}

type TokenProviderVersion = { major: number; minor: number; patch: number };

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
  tokens: Token[];
  version: TokenProviderVersion;
};

export const TokenSchema = object({
  address: optional(string()),
  chain: z.enum(Chain).optional(),
  chainId: z.enum(ChainId),
  coingeckoId: optional(string()),
  decimals: coerce.number(),
  extensions: optional(z.looseObject({})),
  identifier: string(),
  logoURI: optional(string()),
  name: optional(string()),
  shortCode: optional(string()),
  symbol: optional(string()),
  ticker: string(),
});

export type Token = z.infer<typeof TokenSchema>;

export const TrackingRequestSchema = z
  .object({
    block: z.optional(z.number().describe("Block number. Required for Polkadot chain. e.g. `123456`")),
    chainId: z.optional(z.string().describe("ChainId for the hash. e.g. `thorchain-1`")),
    depositChannelId: z.optional(
      z.string().describe("Deposit channel ID, required for Chainflip if tx was broadcasted without wallet connection"),
    ),
    hash: z.optional(
      z
        .string()
        .describe(
          "Hash for the first transaction broadcasted by the end user. e.g. `88D1819378ECD09E5284C54937CDC1E99B52F253C007617A02DD1200710CE677`",
        ),
    ),
  })
  .refine((data) => (data.hash && data.chainId) || data.depositChannelId, {
    message: "Either `hash` and `chainId` or `depositChannelId` must be provided",
  });

export const TrackingRequestQuerySchema = z.object({
  forceUpdate: z
    .string()
    .toLowerCase()
    .transform((x) => x === "true")
    .pipe(z.boolean())
    .optional(),
});

export type TrackingRequest = z.infer<typeof TrackingRequestSchema>;

export const ApiV2ErrorSchema = object({ error: string(), message: string() });

export const AssetValueSchema = object({
  address: optional(string()),
  chain: z.enum(Chain),
  decimal: optional(number()),
  isGasAsset: boolean(),
  isSynthetic: boolean(),
  symbol: string(),
  tax: optional(object({ buy: number(), sell: number() })),
  ticker: string(),
});

export const TokenDetailsMetadataSchema = object({
  id: string(),
  market_cap: number(),
  name: string(),
  price_change_24h_usd: number(),
  price_change_percentage_24h_usd: number(),
  sparkline_in_7d: array(number()),
  timestamp: string(),
  total_volume: number(),
});

export const PriceResponseSchema = array(
  object({
    cg: TokenDetailsMetadataSchema.optional(),
    identifier: string(),
    price_usd: number(),
    provider: string(),
    timestamp: number(),
  }).partial(),
);

export type PriceResponse = z.infer<typeof PriceResponseSchema>;

export const QuoteRequestSchema = object({
  affiliate: optional(string().describe("Affiliate thorname")),
  affiliateFee: optional(
    number()
      .describe("Affiliate fee in basis points")
      .refine((fee) => fee === Math.floor(fee) && fee >= 0, {
        message: "affiliateFee must be a positive integer",
        path: ["affiliateFee"],
      }),
  ),
  allowSmartContractReceiver: optional(boolean().describe("Allow smart contract as recipient")),
  allowSmartContractSender: optional(boolean().describe("Allow smart contract as sender")),
  buyAsset: string().describe("Asset to buy"),
  cfBoost: optional(boolean().describe("Set to true to enable CF boost to speed up Chainflip swaps. BTC only.")),
  destinationAddress: optional(string().describe("Address to send asset to")),
  disableSecurityChecks: optional(boolean().describe("Disable security checks")),
  includeTx: optional(boolean().describe("Set to true to include an transaction object (EVM only)")),
  providers: optional(
    array(
      string()
        .describe("List of providers to use")
        .refine((provider) => ProviderName[provider as ProviderName] !== undefined, {
          message: "Invalid provider",
          path: ["providers"],
        }),
    ),
  ),
  referrer: optional(string().describe("Referrer address (referral program)")),
  sellAmount: string()
    .describe("Amount of asset to sell")
    .refine((amount) => +amount > 0, { message: "sellAmount must be greater than 0", path: ["sellAmount"] }),
  sellAsset: string().describe("Asset to sell"),
  slippage: optional(number().describe("Slippage tolerance as a percentage. Default is 3%.")),
  sourceAddress: optional(string().describe("Address to send asset from")),
}).refine((data) => data.sellAsset !== data.buyAsset, {
  message: "Must be different",
  path: ["sellAsset", "buyAsset"],
});

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const PriceRequestSchema = object({ metadata: boolean(), tokens: array(object({ identifier: string() })) });

export type PriceRequest = z.infer<typeof PriceRequestSchema>;

export const DepositChannelParamsSchema = object({ destinationAddress: string() });

export const BrokerDepositChannelParamsSchema = DepositChannelParamsSchema.extend({
  affiliateFees: array(object({ brokerAddress: string(), feeBps: number() })).optional(),
  brokerCommissionBps: number().optional(),
  buyAsset: object({ asset: string(), chain: string() }),
  channelMetadata: object({
    cfParameters: string().optional(),
    gasBudget: string().optional(),
    message: string().optional(),
  }).optional(),
  dcaParameters: object({ chunkInterval: number().optional(), numberOfChunks: number().optional() }).optional(),
  maxBoostFeeBps: number().optional(),
  refundParameters: object({
    minPrice: string().optional(),
    refundAddress: string().optional(),
    retryDuration: number().optional(),
  }).optional(),
  sellAsset: object({ asset: string(), chain: string() }),
});

export type BrokerDepositChannelParams = z.infer<typeof BrokerDepositChannelParamsSchema>;

export const DepositChannelResponseSchema = object({ channelId: string(), depositAddress: string() });

export const NearDepositChannelParamsSchema = DepositChannelParamsSchema.extend({
  affiliateFees: object({ feeBps: number(), nearId: string() }).optional(),
  buyAsset: string(),
  sellAmount: string(),
  sellAsset: string(),
  slippage: coerce.number(),
  sourceAddress: string(),
});

export type NearDepositChannelParams = z.infer<typeof NearDepositChannelParamsSchema>;

const NearQuoteResponseSchema = object({
  amountIn: string(),
  amountInFormatted: string(),
  amountInUsd: string(),
  amountOut: string(),
  amountOutFormatted: string(),
  amountOutUsd: string(),
  deadline: string().optional(),
  minAmountIn: string(),
  minAmountOut: string(),
  timeEstimate: number().optional(),
  timeWhenInactive: string().optional(),
});

export const NearDepositChannelResultSchema = NearQuoteResponseSchema.extend({
  depositAddress: string(),
  quote: NearQuoteResponseSchema,
  signature: string(),
  timestamp: string(),
  tx: unknown(),
});

export type NearDepositChannelResult = z.infer<typeof NearDepositChannelResultSchema>;

export const NearSwapResponseSchema = object({
  buyAsset: string(),
  buyAssetAmount: string(),
  buyAssetAmountMaxSlippage: string(),
  deadline: string().optional(),
  depositAddress: string(),
  depositAmount: string(),
  depositAsset: string(),
  tx: unknown(),
});

export type NearSwapResponse = z.infer<typeof NearSwapResponseSchema>;

export type DepositChannelResponse = z.infer<typeof DepositChannelResponseSchema>;

const TxnPayloadSchema = object({
  evmCalldata: optional(string()),
  logs: optional(unknown()),
  memo: optional(string()),
  spender: optional(string()), // used in evm approve transactions
});

export type TxnPayload = z.infer<typeof TxnPayloadSchema>;

// props that are most important while the transaction is live
const TxnTransientSchema = object({
  currentLegIndex: optional(number()),
  estimatedFinalisedAt: number(),
  estimatedTimeToComplete: number(),
  providerDetails: optional(unknown()), // see ProviderTransientDetails
  updatedAt: number(),
});

export type TxnTransient = z.infer<typeof TxnTransientSchema>;

const TransactionFeesSchema = object({
  affiliate: optional(AssetValueSchema), // e.g. affiliate in memo, other affiliate mechanisms
  liquidity: optional(AssetValueSchema), // fee paid to pool
  network: optional(AssetValueSchema), // gas on ethereum, network fee on thorchain, etc.
  protocol: optional(AssetValueSchema), // extra protocol fees (TS dex aggregation contracts, stargate fees, etc.)
  tax: optional(AssetValueSchema), // taxed tokens
});

export type TransactionFees = z.infer<typeof TransactionFeesSchema>;

const TxnMetaSchema = object({
  affiliate: optional(string()),
  broadcastedAt: optional(number()),
  explorerUrl: optional(string()),
  fees: optional(TransactionFeesSchema),
  images: optional(
    object({
      chain: optional(string()),
      from: optional(string()),
      provider: optional(string()),
      to: optional(string()),
    }),
  ),
  provider: optional(z.enum(ProviderName)),
  quoteId: optional(string()),
  wallet: optional(string()),
});

export type TxnMeta = z.infer<typeof TxnMetaSchema>;

const TransactionLegDTOSchema = z.object({
  block: z.number(),
  chainId: z.enum(ChainId),
  finalAddress: z.optional(z.string()),
  finalAsset: z.optional(AssetValueSchema),

  finalisedAt: z.number(),
  fromAddress: z.string(),
  fromAmount: z.string(),

  fromAsset: z.string(),
  hash: z.string(),
  meta: z.optional(TxnMetaSchema),
  payload: z.optional(TxnPayloadSchema),
  status: z.enum(TxnStatus),
  toAddress: z.string(),
  toAmount: z.string(),
  toAsset: z.string(),
  trackingStatus: z.optional(z.enum(TrackingStatus)),

  transient: z.optional(TxnTransientSchema),
  type: z.enum(TxnType),
});

export type TransactionLegDTO = z.infer<typeof TransactionLegDTOSchema>;

export const TrackerResponseSchema: z.ZodType<TransactionDTO> = TransactionLegDTOSchema.extend({
  legs: z.array(TransactionLegDTOSchema),
});

export type TrackerResponse = z.infer<typeof TrackerResponseSchema>;

export const TransactionSchema = TransactionLegDTOSchema.extend({ legs: array(TransactionLegDTOSchema) });

export type TransactionDTO = z.infer<typeof TransactionLegDTOSchema> & { legs: TransactionLegDTO[] };

export const TransactionDTOSchema: ZodType<TransactionDTO> = TransactionLegDTOSchema.extend({
  legs: array(TransactionLegDTOSchema),
});

export const FeesSchema = array(
  object({
    amount: string(),
    asset: string(),
    chain: string(),
    protocol: z.enum(ProviderName),
    type: z.enum(FeeTypeEnum),
  }),
);

export type Fees = z.infer<typeof FeesSchema>;

export const EstimatedTimeSchema = z.object({
  inbound: z.optional(z.number().describe("Time to receive inbound asset in seconds")),
  outbound: z.optional(z.number().describe("Time to receive outbound asset in seconds")),
  swap: z.optional(z.number().describe("Time to swap assets in seconds")),
  total: z.number().describe("Total time in seconds"),
});

export type EstimatedTime = z.infer<typeof EstimatedTimeSchema>;

export const EVMTransactionSchema = object({
  data: string().describe("Data to send"),
  from: string().describe("Address of the sender"),
  to: string().describe("Address of the recipient"),
  value: string().describe("Value to send"),
});

export type EVMTransaction = z.infer<typeof EVMTransactionSchema>;

export const EVMTransactionDetailsParamsSchema = array(
  union([
    string(),
    number(),
    array(string()),
    object({ from: string(), value: string() }).describe("Parameters to pass to the contract method"),
  ]),
);

export type EVMTransactionDetailsParams = z.infer<typeof EVMTransactionDetailsParamsSchema>;

export const EVMTransactionDetailsSchema = object({
  approvalSpender: optional(string().describe("Address of the spender to approve")),
  approvalToken: optional(string().describe("Address of the token to approve spending of")),
  contractAddress: string().describe("Address of the contract to interact with"),
  contractMethod: string().describe("Name of the method to call"),
  contractParamNames: array(string().describe("Names of the parameters to pass to the contract method")),
  contractParams: EVMTransactionDetailsParamsSchema,
});

export type EVMTransactionDetails = z.infer<typeof EVMTransactionDetailsSchema>;

const EncodeObjectSchema = object({ typeUrl: string(), value: unknown() });

const FeeSchema = object({ amount: array(object({ amount: string(), denom: string() })), gas: string() });

export const CosmosTransactionSchema = object({
  accountNumber: number(),
  chainId: z.enum(ChainId),
  fee: FeeSchema,
  memo: string(),
  msgs: array(EncodeObjectSchema),
  sequence: number(),
});

export type CosmosTransaction = z.infer<typeof CosmosTransactionSchema>;

export const RouteLegSchema = object({
  affiliate: string().describe("Affiliate address").optional(),
  affiliateFee: number().describe("Affiliate fee").optional(),
  buyAsset: string().describe("Asset to buy"),
  destinationAddress: string().describe("Destination address"),
  estimatedTime: EstimatedTimeSchema.optional(),
  provider: z.enum(ProviderName),
  sellAsset: string().describe("Asset to sell"),
  slipPercentage: number().describe("Slippage as a percentage"),
  sourceAddress: string().describe("Source address"),
});

export type RouteLeg = z.infer<typeof RouteLegSchema>;

export const RouteLegWithoutAddressesSchema = RouteLegSchema.omit({
  destinationAddress: true,
  slipPercentage: true,
  sourceAddress: true,
});

export type RouteLegWithoutAddresses = z.infer<typeof RouteLegWithoutAddressesSchema>;

export const RouteQuoteMetadataAssetSchema = object({
  asset: string().describe("Asset name"),
  image: string().describe("Asset image"),
  price: number().describe("Price in USD"),
});

export type RouteQuoteMetadataAsset = z.infer<typeof RouteQuoteMetadataAssetSchema>;

export const ChainflipMetadataSchema = BrokerDepositChannelParamsSchema;

export type ChainflipMetadata = z.infer<typeof ChainflipMetadataSchema>;

export const RouteQuoteMetadataSchema = object({
  assets: optional(array(RouteQuoteMetadataAssetSchema)),
  maxStreamingQuantity: number().optional(),
  referrer: string().optional(),
  streamingInterval: number().optional(),
  tags: array(z.enum(PriorityLabel)),
});

export const RouteQuoteMetadataV2Schema = RouteQuoteMetadataSchema.extend({
  affiliate: optional(string()),
  affiliateFee: optional(string()),
  approvalAddress: optional(string().describe("Approval address for swap")),
  chainflip: ChainflipMetadataSchema.optional(),
  near: NearDepositChannelParamsSchema.optional(),
  priceImpact: optional(number().describe("Price impact")),
  referrer: optional(string()),
  txType: optional(z.enum(RouteQuoteTxType)),
});

export const RouteQuoteWarningSchema = array(
  object({ code: z.enum(WarningCodeEnum), display: string(), tooltip: string().optional() }),
);

export type RouteQuoteWarning = z.infer<typeof RouteQuoteWarningSchema>;

const QuoteResponseRouteLegItem = object({
  buyAmount: string().describe("Buy amount"),
  buyAmountMaxSlippage: string().describe("Buy amount max slippage"),
  buyAsset: string().describe("Asset to buy"),
  fees: optional(FeesSchema),
  provider: z.enum(ProviderName),
  sellAmount: string().describe("Sell amount"),
  sellAsset: string().describe("Asset to sell"),
});

const QuoteResponseRouteItem = object({
  buyAsset: string().describe("Asset to buy"),
  destinationAddress: string().describe("Destination address"),
  estimatedTime: optional(EstimatedTimeSchema),
  expectedBuyAmount: string().describe("Expected Buy amount"),
  expectedBuyAmountMaxSlippage: string().describe("Expected Buy amount max slippage"),
  expiration: optional(string().describe("Expiration")),
  fees: FeesSchema,
  inboundAddress: optional(string().describe("Inbound address")),
  legs: array(QuoteResponseRouteLegItem),
  memo: optional(string().describe("Memo")),
  meta: RouteQuoteMetadataV2Schema,
  providers: array(z.enum(ProviderName)),
  sellAmount: string().describe("Sell amount"),
  sellAsset: string().describe("Asset to sell"),
  sourceAddress: string().describe("Source address"),
  targetAddress: optional(string().describe("Target address")),
  totalSlippageBps: number().describe("Total slippage in bps"),
  tx: optional(union([EVMTransactionSchema, CosmosTransactionSchema, string()])),
  txType: optional(z.enum(RouteQuoteTxType)),
  warnings: RouteQuoteWarningSchema,
});

export const QuoteResponseSchema = object({
  error: optional(string().describe("Error message")),
  providerErrors: optional(
    array(
      object({
        errorCode: optional(z.enum(ErrorCode)),
        message: optional(string()),
        provider: z.enum(ProviderName).optional(),
      }),
    ),
  ),
  quoteId: string().describe("Quote ID"),
  routes: array(QuoteResponseRouteItem),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteResponseRoute = z.infer<typeof QuoteResponseRouteItem>;
export type QuoteResponseRouteLeg = z.infer<typeof QuoteResponseRouteLegItem>;

export const GasSchema = z.object({
  chainId: z.enum(ChainId),
  createdAt: z.date(),
  id: z.number(),
  unit: z.string(),
  value: z.string(),
});

const GasSchemaArray = z.array(GasSchema);

export const GasResponseSchema = z.union([GasSchema, GasSchemaArray]);

export type GasResponse = z.infer<typeof GasResponseSchema>;

const BalanceResponseSchema = array(
  object({
    chain: z.enum(Chain),
    decimal: number(),
    identifier: string(),
    symbol: string(),
    ticker: string(),
    value: string(),
  }),
);

export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;
