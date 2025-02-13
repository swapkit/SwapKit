import { BigIntArithmetics, formatBigIntToSafeValue } from "./bigIntArithmetics";

export type SwapKitValueType = BigIntArithmetics | string | number;

export class SwapKitNumber extends BigIntArithmetics {
  eq(value: SwapKitValueType) {
    return this.eqValue(value);
  }

  static fromBigInt(value: bigint, decimal?: number) {
    return new SwapKitNumber({
      decimal,
      value: formatBigIntToSafeValue({ value, bigIntDecimal: decimal, decimal }),
    });
  }
}
