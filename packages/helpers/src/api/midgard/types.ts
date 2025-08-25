// Pool types
export type Pool = {
  asset: string;
  assetDepth: string;
  assetPrice: string;
  assetPriceUSD: string;
  liquidityUnits: string;
  poolAPY: string;
  runeDepth: string;
  saversAPR: string;
  saversDepth: string;
  saversUnits: string;
  status: string;
  synthSupply: string;
  synthUnits: string;
  units: string;
  volume24h: string;
};

export type PoolStats = {
  addAssetLiquidityVolume: string;
  addLiquidityCount: string;
  addLiquidityVolume: string;
  addRuneLiquidityVolume: string;
  annualPercentageRate: string;
  asset: string;
  assetDepth: string;
  assetPrice: string;
  assetPriceUSD: string;
  averageSlip: string;
  earnings: string;
  earningsAnnualAsPercentOfDepth: string;
  impermanentLossProtectionPaid: string;
  liquidityUnits: string;
  period: string;
  poolAPY: string;
  runeDepth: string;
  status: string;
  swapCount: string;
  swapVolume: string;
  synthSupply: string;
  synthUnits: string;
  toAssetAverageSlip: string;
  toAssetCount: string;
  toAssetFees: string;
  toAssetVolume: string;
  toRuneAverageSlip: string;
  toRuneCount: string;
  toRuneFees: string;
  toRuneVolume: string;
  totalFees: string;
  uniqueMemberCount: string;
  uniqueSwapperCount: string;
  units: string;
  withdrawAssetVolume: string;
  withdrawCount: string;
  withdrawRuneVolume: string;
  withdrawVolume: string;
};

// Network types
export type NetworkInfo = {
  blockRewards: { blockReward: string; bondReward: string; poolReward: string };
  bondMetrics: {
    averageActiveBond: string;
    averageStandbyBond: string;
    maximumActiveBond: string;
    maximumStandbyBond: string;
    medianActiveBond: string;
    medianStandbyBond: string;
    minimumActiveBond: string;
    minimumStandbyBond: string;
    totalActiveBond: string;
    totalStandbyBond: string;
  };
  bondingAPY: string;
  liquidityAPY: string;
  nextChurnHeight: string;
  poolActivationCountdown: number;
  poolShareFactor: string;
  runePriceUSD: string;
};

export type HealthInfo = { database: boolean; inSync: boolean; scannerHeight: string; thornodeHeight: string };

export type Node = {
  bond: string;
  award: string;
  slash: string;
  leaveHeight: string;
  ipAddress: string;
  status: string;
  version: string;
  forcedToLeave: boolean;
  requestedToLeave: boolean;
  bondAddress: string;
  preflight: { status: string; reason: string; code: number };
  nodeOperatorAddress: string;
  nodeAddress: string;
  observerAddress: string;
  pubKeySet: { secp256k1: string; ed25519: string };
  bondProviders: { nodeOperatorFee: string; providers: Array<{ bondAddress: string; bond: string }> };
  signMembership: string[];
  jail: { releaseHeight: string; reason: string };
};

// Stats types
export type Stats = {
  addLiquidityCount: string;
  addLiquidityVolume: string;
  annualPercentageRate: string;
  bondingAPY: string;
  dailyActiveUsers: string;
  dailyTx: string;
  impermanentLossProtectionPaid: string;
  liquidityAPY: string;
  monthlyActiveUsers: string;
  poolCount: string;
  runeDepth: string;
  runePriceUSD: string;
  swapCount: string;
  swapCount24h: string;
  swapCount30d: string;
  swapVolume: string;
  swapVolume24h: string;
  swapVolume30d: string;
  synthBurnCount: string;
  synthMintCount: string;
  toAssetCount: string;
  toRuneCount: string;
  totalEarned: string;
  totalVolume24h: string;
  totalVolumeUSD: string;
  uniqueSwapperCount: string;
  withdrawCount: string;
  withdrawVolume: string;
};

// Action types
export type Action = {
  date: string;
  height: string;
  in: Transaction[];
  metadata: {
    swap?: SwapMetadata;
    addLiquidity?: AddLiquidityMetadata;
    withdraw?: WithdrawMetadata;
    refund?: RefundMetadata;
    bond?: BondMetadata;
    switch?: SwitchMetadata;
  };
  out: Transaction[];
  pools: string[];
  status: string;
  type: string;
};

export type Transaction = { address: string; coins: Coin[]; txID: string };

export type Coin = { amount: string; asset: string };

export type SwapMetadata = {
  affiliateAddress: string;
  affiliateFee: string;
  isStreamingSwap: boolean;
  liquidityFee: string;
  memo: string;
  networkFees: Coin[];
  swapSlip: string;
  swapTarget: string;
};

export type AddLiquidityMetadata = { liquidityUnits: string };

export type WithdrawMetadata = { asymmetry: string; basisPoints: string; liquidityUnits: string; networkFees: Coin[] };

export type RefundMetadata = { networkFees: Coin[]; reason: string };

export type BondMetadata = { bondType: string };

export type SwitchMetadata = { burn: Coin; mint: Coin };

// THORName/MAYAName types
export type THORNameDetails = {
  /** @description List details of all chains and their addresses for a given THORName */
  entries: THORNameEntry[];
  /** @description Int64, THORChain block height in which THORName expires */
  expire: string;
  /**
   * @description owner's THOR address
   * @example thor102y0m3uptg0vvudeyh00r2fnz70wq7d8y7mu2g
   */
  owner: string;
};

export type THORNameEntry = {
  /** @description address on blockchain */
  address: string;
  /** @description blockchain */
  chain: string;
};

// Member types
export type MemberDetailsMayachain = {
  /** @MemberPool List details of all the liquidity providers identified with the given address */
  pools: MemberPoolMayachain[];
};

export type MemberPoolMayachain = {
  /** @description Int64(e8), total asset added to the pool by member */
  assetAdded: string;
  /** @description asset address used by the member */
  assetAddress: string;
  /** @description Int64(e8), total asset that is currently deposited to the pool by member.
   *     This field is same as the `asset_deposit_value` field in thornode. Mainly can be used
   *     for tracking, mainly Growth Percentage
   *      */
  assetDeposit: string;
  /** @description Int64(e8), asset sent but not added yet, it will be added when the rune pair arrives
   *      */
  assetPending: string;
  /** @description Int64(e8), total asset withdrawn from the pool by member */
  assetWithdrawn: string;
  /** @description Int64(e8), total Cacao that is currently deposited to the pool by member.
   *     This field is same as the `rune_deposit_value` field in thornode. Mainly can be used
   *     for tracking, mainly Growth Percentage
   *      */
  cacaoDeposit: string;
  /** @description Int64, Unix timestamp for the first time member deposited into the pool */
  dateFirstAdded: string;
  /** @description Int64, Unix timestamp for the last time member deposited into the pool */
  dateLastAdded: string;
  /** @description Int64, pool liquidity units that belong the the member */
  liquidityUnits: string;
  /** @description Pool rest of the data refers to */
  pool: string;
  /** @description Int64(e8), total Rune added to the pool by member */
  runeAdded: string;
  /** @description Rune address used by the member */
  runeAddress: string;
  /** @description Int64(e8), Rune sent but not added yet, it will be added when the asset pair arrives
   *      */
  runePending: string;
  /** @description Int64(e8), total Rune withdrawn from the pool by member */
  runeWithdrawn: string;
};

export type MemberDetailsThorchain = {
  /** @MemberPool List details of all the liquidity providers identified with the given address */
  pools: MemberPoolThorchain[];
};

export type MemberPoolThorchain = {
  /** @description Int64(e8), total asset added to the pool by member */
  assetAdded: string;
  /** @description asset address used by the member */
  assetAddress: string;
  /** @description Int64(e8), total asset that is currently deposited to the pool by member.
   *     This field is same as the `asset_deposit_value` field in thornode. Mainly can be used
   *     for tracking, mainly Growth Percentage
   *      */
  assetDeposit: string;
  /** @description Int64(e8), asset sent but not added yet, it will be added when the rune pair arrives
   *      */
  assetPending: string;
  /** @description Int64(e8), total asset withdrawn from the pool by member */
  assetWithdrawn: string;
  /** @description Int64(e8), total Rune that is currently deposited to the pool by member.
   *     This field is same as the `rune_deposit_value` field in thornode. Mainly can be used
   *     for tracking, mainly Growth Percentage
   *      */
  runeDeposit: string;
  /** @description Int64, Unix timestamp for the first time member deposited into the pool */
  dateFirstAdded: string;
  /** @description Int64, Unix timestamp for the last time member deposited into the pool */
  dateLastAdded: string;
  /** @description Int64, pool liquidity units that belong the the member */
  liquidityUnits: string;
  /** @description Pool rest of the data refers to */
  pool: string;
  /** @description Int64(e8), total Rune added to the pool by member */
  runeAdded: string;
  /** @description Rune address used by the member */
  runeAddress: string;
  /** @description Int64(e8), Rune sent but not added yet, it will be added when the asset pair arrives
   *      */
  runePending: string;
  /** @description Int64(e8), total Rune withdrawn from the pool by member */
  runeWithdrawn: string;
};

// Saver types
export type SaverDetails = {
  asset: string;
  assetAddress: string;
  lastAddHeight: string;
  lastWithdrawHeight: string;
  units: string;
  assetDepositValue: string;
  assetRedeemValue: string;
  growthPct: string;
};

export type SaversHistory = {
  intervals: Array<{
    startTime: string;
    endTime: string;
    saversCount: string;
    saversUnits: string;
    saversDepth: string;
  }>;
  meta: {
    startTime: string;
    endTime: string;
    priceShiftLoss: string;
    luviIncrease: string;
    earned: string;
    runePriceUSD: string;
  };
};

// Earnings types
export type EarningsHistory = {
  intervals: Array<{
    startTime: string;
    endTime: string;
    liquidityFees: string;
    blockRewards: string;
    earnings: string;
    bondingEarnings: string;
    liquidityEarnings: string;
    avgNodeCount: string;
    runePriceUSD: string;
    pools: Array<{
      pool: string;
      assetLiquidityFees: string;
      runeLiquidityFees: string;
      totalLiquidityFeesRune: string;
      saverEarning: string;
      rewards: string;
      earnings: string;
    }>;
  }>;
  meta: { bonding: string; liquidity: string; earnings: string; runePriceUSD: string };
};

// TVL types
export type TVLHistory = {
  intervals: Array<{
    startTime: string;
    endTime: string;
    totalValuePooled: string;
    totalValueBonded: string;
    totalValueLocked: string;
    bondTVL: string;
    poolTVL: string;
    runePriceUSD: string;
    totalActiveBond: string;
    totalPooledRune: string;
  }>;
  meta: {
    startTime: string;
    endTime: string;
    startTotalPooledRune: string;
    endTotalPooledRune: string;
    startTVLPooled: string;
    endTVLPooled: string;
    startRunePriceUSD: string;
    endRunePriceUSD: string;
    priceShiftLoss: string;
    luviIncrease: string;
  };
};

// Swap history types
export type SwapHistory = {
  intervals: Array<{
    startTime: string;
    endTime: string;
    toAssetCount: string;
    toRuneCount: string;
    toTradeCount: string;
    fromTradeCount: string;
    synthMintCount: string;
    synthRedeemCount: string;
    totalCount: string;
    toAssetVolume: string;
    toRuneVolume: string;
    toTradeVolume: string;
    fromTradeVolume: string;
    synthMintVolume: string;
    synthRedeemVolume: string;
    totalVolume: string;
    toAssetVolumeUSD: string;
    toRuneVolumeUSD: string;
    toTradeVolumeUSD: string;
    fromTradeVolumeUSD: string;
    synthMintVolumeUSD: string;
    synthRedeemVolumeUSD: string;
    totalVolumeUSD: string;
    toAssetFees: string;
    toRuneFees: string;
    toTradeFees: string;
    fromTradeFees: string;
    synthMintFees: string;
    synthRedeemFees: string;
    totalFees: string;
    toAssetAverageSlip: string;
    toRuneAverageSlip: string;
    toTradeAverageSlip: string;
    fromTradeAverageSlip: string;
    synthMintAverageSlip: string;
    synthRedeemAverageSlip: string;
    averageSlip: string;
    runePriceUSD: string;
  }>;
  meta: {
    startTime: string;
    endTime: string;
    toAssetCount: string;
    toRuneCount: string;
    toTradeCount: string;
    fromTradeCount: string;
    synthMintCount: string;
    synthRedeemCount: string;
    totalCount: string;
    toAssetVolume: string;
    toRuneVolume: string;
    toTradeVolume: string;
    fromTradeVolume: string;
    synthMintVolume: string;
    synthRedeemVolume: string;
    totalVolume: string;
    toAssetVolumeUSD: string;
    toRuneVolumeUSD: string;
    toTradeVolumeUSD: string;
    fromTradeVolumeUSD: string;
    synthMintVolumeUSD: string;
    synthRedeemVolumeUSD: string;
    totalVolumeUSD: string;
    toAssetFees: string;
    toRuneFees: string;
    toTradeFees: string;
    fromTradeFees: string;
    synthMintFees: string;
    synthRedeemFees: string;
    totalFees: string;
    toAssetAverageSlip: string;
    toRuneAverageSlip: string;
    toTradeAverageSlip: string;
    fromTradeAverageSlip: string;
    synthMintAverageSlip: string;
    synthRedeemAverageSlip: string;
    averageSlip: string;
    runePriceUSD: string;
  };
};

// Balance types
export type Balance = { asset: string; amount: string; dateLastAdded?: string };

// Depth history types
export type DepthHistory = {
  intervals: Array<{
    startTime: string;
    endTime: string;
    assetDepth: string;
    assetPrice: string;
    assetPriceUSD: string;
    liquidityUnits: string;
    membersCount: string;
    runeDepth: string;
    synthSupply: string;
    synthUnits: string;
    units: string;
  }>;
  meta: {
    startTime: string;
    endTime: string;
    priceShiftLoss: string;
    luviIncrease: string;
    startAssetDepth: string;
    startRuneDepth: string;
    startLPUnits: string;
    startSynthUnits: string;
    endAssetDepth: string;
    endRuneDepth: string;
    endLPUnits: string;
    endSynthUnits: string;
  };
};

// Constants types
export type Constants = {
  int64_values: Record<string, string>;
  bool_values: Record<string, boolean>;
  string_values: Record<string, string>;
};

// Generic response wrapper types
export type PagedResponse<T> = { data: T[]; meta?: { total?: number; nextPageToken?: string; prevPageToken?: string } };

export type HistoryQuery = { interval?: string; count?: number; from?: number; to?: number };

export type ActionQuery = {
  address?: string;
  txid?: string;
  asset?: string;
  type?: string;
  affiliate?: string;
  limit?: number;
  offset?: number;
};

export type MimirVote = { key: string; value: string; signer: string; blockHeight: string };
