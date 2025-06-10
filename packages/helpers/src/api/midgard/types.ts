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
