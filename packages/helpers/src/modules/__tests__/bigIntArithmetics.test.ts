import { describe, expect, test } from "bun:test";

import { formatBigIntToSafeValue } from "../bigIntArithmetics";

describe("BigIntArithmatics", () => {
  describe("formatBigIntToSafeValue", () => {
    test("parse bigint with decimals to string", () => {
      const safeValue1 = formatBigIntToSafeValue({ bigIntDecimal: 6, decimal: 6, value: BigInt(0) });
      expect(safeValue1).toBe("0");

      const safeValue2 = formatBigIntToSafeValue({ bigIntDecimal: 0, decimal: 0, value: BigInt(15) });
      expect(safeValue2).toBe("15");

      const safeValue3 = formatBigIntToSafeValue({ bigIntDecimal: 4, decimal: 4, value: BigInt(123456789) });
      expect(safeValue3).toBe("12345.6789");
    });
  });
});
