import { describe, expect, test } from "bun:test";

import { formatBigIntToSafeValue } from "../bigIntArithmetics";

describe("BigIntArithmatics", () => {
  describe("formatBigIntToSafeValue", () => {
    test("parse bigint with decimals to string", () => {
      const safeValue1 = formatBigIntToSafeValue({
        value: BigInt(0),
        decimal: 6,
        bigIntDecimal: 6,
      });
      expect(safeValue1).toBe("0");

      const safeValue2 = formatBigIntToSafeValue({
        value: BigInt(15),
        decimal: 0,
        bigIntDecimal: 0,
      });
      expect(safeValue2).toBe("15");

      const safeValue3 = formatBigIntToSafeValue({
        value: BigInt(123456789),
        decimal: 4,
        bigIntDecimal: 4,
      });
      expect(safeValue3).toBe("12345.6789");
    });
  });
});
