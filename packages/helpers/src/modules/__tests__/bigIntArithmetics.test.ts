import { describe, expect, test } from "bun:test";

import { BigIntArithmetics, formatBigIntToSafeValue } from "../bigIntArithmetics";

describe("BigIntArithmetics", () => {
  describe("formatBigIntToSafeValue", () => {
    test("parse bigint with decimals to string", () => {
      const safeValue1 = formatBigIntToSafeValue({ bigIntDecimal: 6, decimal: 6, value: BigInt(0) });
      expect(safeValue1).toBe("0");

      const safeValue2 = formatBigIntToSafeValue({ bigIntDecimal: 0, decimal: 0, value: BigInt(15) });
      expect(safeValue2).toBe("15");

      const safeValue3 = formatBigIntToSafeValue({ bigIntDecimal: 4, decimal: 4, value: BigInt(123456789) });
      expect(safeValue3).toBe("12345.6789");
    });

    test("handles negative values correctly", () => {
      const safeValue = formatBigIntToSafeValue({ bigIntDecimal: 8, decimal: 8, value: -100000000n });
      expect(safeValue).toBe("-1");

      const safeValue2 = formatBigIntToSafeValue({ bigIntDecimal: 6, decimal: 6, value: -123456789n });
      expect(safeValue2).toBe("-123.456789");
    });

    test("handles rounding correctly when bigIntDecimal < decimal", () => {
      // Value: 1.99, rounding to 1 decimal
      const safeValue = formatBigIntToSafeValue({ bigIntDecimal: 1, decimal: 2, value: 199n });
      expect(safeValue).toBe("1.1");

      // Value: 1.94, rounding to 1 decimal
      const safeValue2 = formatBigIntToSafeValue({ bigIntDecimal: 1, decimal: 2, value: 194n });
      expect(safeValue2).toBe("1.9");
    });

    test("handles very large bigint values", () => {
      const largeValue = 123456789012345678901234567890n;
      const safeValue = formatBigIntToSafeValue({ bigIntDecimal: 8, decimal: 8, value: largeValue });
      expect(safeValue).toBe("1234567890123456789012.3456789");
    });
  });

  describe("toFixed", () => {
    test("returns fixed decimal places for positive number", () => {
      const num = new BigIntArithmetics(123.456789);
      expect(num.toFixed(2)).toBe("123.46");
      expect(num.toFixed(4)).toBe("123.4568");
      expect(num.toFixed(6)).toBe("123.456789");
    });

    test("returns fixed decimal places for decimal less than 1", () => {
      const num = new BigIntArithmetics(0.123456);
      expect(num.toFixed(2)).toBe("0.12");
      expect(num.toFixed(4)).toBe("0.1235");
      expect(num.toFixed(6)).toBe("0.123456");
    });

    test("pads with zeros when needed", () => {
      const num = new BigIntArithmetics(1.2);
      expect(num.toFixed(4)).toBe("1.2000");

      const num2 = new BigIntArithmetics(10);
      expect(num2.toFixed(2)).toBe("10.00");
    });

    test("handles zero with fixed decimals", () => {
      const num = new BigIntArithmetics(0);
      expect(num.toFixed(0)).toBe("0");
      expect(num.toFixed(2)).toBe("0.00");
    });

    test("handles very small decimals", () => {
      const num = new BigIntArithmetics(0.00000123);
      expect(num.toFixed(8)).toBe("0.00000123");
      expect(num.toFixed(6)).toBe("0.000001");
    });

    test("handles negative numbers with toFixed", () => {
      const num = new BigIntArithmetics(-123.456);
      expect(num.toFixed(2)).toBe("-123.46");
      expect(num.toFixed(4)).toBe("-123.4560");
    });

    test("handles integer with toFixed", () => {
      const num = new BigIntArithmetics(1234);
      expect(num.toFixed(0)).toBe("1234.0");
      expect(num.toFixed(2)).toBe("1234.00");
    });

    test("handles very large numbers without precision loss", () => {
      const large = new BigIntArithmetics("12345678901234567890.123456789");
      expect(large.toFixed(2)).toBe("12345678901234567890.12");
      expect(large.toFixed(6)).toBe("12345678901234567890.123457");

      const roundUp = new BigIntArithmetics("999999999999999999.999");
      expect(roundUp.toFixed(2)).toBe("1000000000000000000.00");
      expect(roundUp.toFixed(0)).toBe("1000000000000000000.0");
    });
  });

  describe("divideBigIntWithRounding edge cases", () => {
    test("handles positive divided by positive with rounding", () => {
      const num1 = new BigIntArithmetics(10);
      const num2 = new BigIntArithmetics(3);
      const result = num1.div(num2);

      // 10 / 3 = 3.333...
      expect(result.getValue("number")).toBeCloseTo(3.333333, 5);
    });

    test("handles negative divided by positive", () => {
      const num1 = new BigIntArithmetics(-10);
      const num2 = new BigIntArithmetics(3);
      const result = num1.div(num2);

      expect(result.getValue("number")).toBeCloseTo(-3.333333, 5);
    });

    test("handles positive divided by negative", () => {
      const num1 = new BigIntArithmetics(10);
      const num2 = new BigIntArithmetics(-3);
      const result = num1.div(num2);

      expect(result.getValue("number")).toBeCloseTo(-3.333333, 5);
    });

    test("handles negative divided by negative", () => {
      const num1 = new BigIntArithmetics(-10);
      const num2 = new BigIntArithmetics(-3);
      const result = num1.div(num2);

      expect(result.getValue("number")).toBeCloseTo(3.333333, 5);
    });

    test("Division of minimum base value maintains precision", () => {
      const minValue = new BigIntArithmetics({ decimal: 8, value: 0.00000001 });
      expect(minValue.getBaseValue("bigint")).toBe(1n);

      const divided = minValue.div(2);
      expect(divided.getBaseValue("bigint")).toBe(1n);

      const multiplied = divided.mul(2);
      expect(multiplied.getBaseValue("bigint")).toBe(1n);
    });

    test("Division with sub-unit precision is maintained", () => {
      const value = new BigIntArithmetics({ decimal: 8, value: 0.00000001 });

      expect(value.div(2).getBaseValue("bigint")).toBe(1n);
      expect(value.div(3).getBaseValue("bigint")).toBe(0n);
      expect(value.div(10).getBaseValue("bigint")).toBe(0n);
      expect(value.div(100).getBaseValue("bigint")).toBe(0n);
    });

    test("Percentage calculations on small values preserve precision", () => {
      const fee = new BigIntArithmetics({ decimal: 8, value: 0.00000001 });

      const tenPercent = fee.mul(0.1);
      expect(tenPercent.getValue("string")).toBe("0.000000001");

      const dividedBy10 = fee.div(10);
      expect(dividedBy10.getValue("string")).toBe("0.000000001");

      expect(tenPercent.getValue("string")).toBe(dividedBy10.getValue("string"));
    });
  });

  describe("constructor edge cases", () => {
    test("handles string with commas", () => {
      const num = new BigIntArithmetics("1,234.56");
      expect(num.getValue("number")).toBe(1234.56);
    });

    test("handles very large number strings", () => {
      const num = new BigIntArithmetics("123456789012345678901234567890");
      expect(num.getValue("string")).toContain("123456789012345678901234567890");
    });

    test("handles decimal parameter correctly", () => {
      const num = new BigIntArithmetics({ decimal: 2, value: 1.234 });
      expect(num.decimal).toBe(2);
      expect(num.getValue("string")).toBe("1.23");
    });

    test("handles BigIntArithmetics instance as parameter", () => {
      const num1 = new BigIntArithmetics(100);
      const num2 = new BigIntArithmetics(num1);
      expect(num2.getValue("number")).toBe(100);
    });
  });

  describe("getValue with different types", () => {
    test("returns correct type for each option", () => {
      const num = new BigIntArithmetics(123.456);

      expect(typeof num.getValue("string")).toBe("string");
      expect(typeof num.getValue("number")).toBe("number");
      expect(typeof num.getValue("bigint")).toBe("bigint");
    });

    test("handles adjusted decimal parameter", () => {
      const num = new BigIntArithmetics({ decimal: 18, value: "1.123456789012345678" });

      expect(num.getValue("string", 8)).toBe("1.12345679");
      expect(num.getValue("string", 12)).toBe("1.123456789012");
    });
  });

  describe("getBaseValue with different types", () => {
    test("returns base value correctly for bigint", () => {
      const num = new BigIntArithmetics({ decimal: 8, value: 1 });
      expect(num.getBaseValue("bigint")).toBe(100000000n);
    });

    test("returns base value correctly for number", () => {
      const num = new BigIntArithmetics({ decimal: 8, value: 1.5 });
      expect(num.getBaseValue("number")).toBe(150000000);
    });

    test("returns base value correctly for string", () => {
      const num = new BigIntArithmetics({ decimal: 6, value: 100.5 });
      expect(num.getBaseValue("string")).toBe("100500000");
    });

    test("handles decimal adjustment in getBaseValue", () => {
      const num = new BigIntArithmetics({ decimal: 18, value: 1 });
      expect(num.getBaseValue("bigint", 8)).toBe(100000000n);
      expect(num.getBaseValue("bigint", 10)).toBe(10000000000n);
    });
  });

  describe("toAbbreviation edge cases", () => {
    test("handles negative numbers with abbreviation", () => {
      const num = new BigIntArithmetics(-1234567);
      expect(num.toAbbreviation()).toBe("-1.23M");
    });

    test("handles zero", () => {
      const num = new BigIntArithmetics(0);
      expect(num.toAbbreviation()).toBe("0");
    });

    test("handles numbers smaller than 1000", () => {
      const num = new BigIntArithmetics(999);
      expect(num.toAbbreviation()).toBe("999");
    });

    test("handles very large numbers beyond defined abbreviations", () => {
      const num = new BigIntArithmetics("1234567890123456789012345");
      const result = num.toAbbreviation();
      expect(result).toEqual(num.getValue("string"));
    });

    test("respects custom digit parameter", () => {
      const num = new BigIntArithmetics(1234567);
      expect(num.toAbbreviation(0)).toBe("1M");
      expect(num.toAbbreviation(1)).toBe("1.2M");
      expect(num.toAbbreviation(3)).toBe("1.235M");
    });
  });

  describe("toCurrency edge cases", () => {
    test("currency symbols €, £, ¥", () => {
      const num = new BigIntArithmetics(1234.56);
      expect(num.toCurrency("€")).toBe("€1,234.56");
      expect(num.toCurrency("£")).toBe("£1,234.56");
      expect(num.toCurrency("¥")).toBe("¥1,234.56");
    });

    test("currency position start and end", () => {
      const num = new BigIntArithmetics(1234.56);
      expect(num.toCurrency("€", { currencyPosition: "start" })).toBe("€1,234.56");
      expect(num.toCurrency("€", { currencyPosition: "end" })).toBe("1,234.56€");
    });

    test("european format with custom separators", () => {
      const num = new BigIntArithmetics(1234567.89);
      expect(num.toCurrency("€", { currencyPosition: "end", decimalSeparator: ",", thousandSeparator: "." })).toBe(
        "1.234.567,89€",
      );
    });

    test("small values < 1 rounds to decimal with trailing zeros removed without floating-point artifacts", () => {
      expect(new BigIntArithmetics(0.015072).toCurrency("")).toBe("0.02");
      expect(new BigIntArithmetics(0.333145).toCurrency("")).toBe("0.33");
      expect(new BigIntArithmetics(0.000005).toCurrency("")).toBe("0");
      expect(new BigIntArithmetics(0.00000548).toCurrency("", { decimal: 6 })).toBe("0.000005");
      expect(new BigIntArithmetics(0.00003801).toCurrency("", { decimal: 6 })).toBe("0.000038");
    });

    test("small values strip trailing zeros", () => {
      expect(new BigIntArithmetics(0.12).toCurrency("")).toBe("0.12");
      expect(new BigIntArithmetics(0.1).toCurrency("")).toBe("0.1");
      expect(new BigIntArithmetics(0.10000001).toCurrency("")).toBe("0.1");
    });

    test("negative small values", () => {
      expect(new BigIntArithmetics(-0.015072).toCurrency("")).toBe("-0.02");
      expect(new BigIntArithmetics(-0.00000001).toCurrency("", { decimal: 8 })).toBe("-0.00000001");
      expect(new BigIntArithmetics(-0.00003801).toCurrency("", { decimal: 6 })).toBe("-0.000038");
      expect(new BigIntArithmetics(-0.00000548).toCurrency("")).toBe("0");
    });

    test("values >= 1 round to decimal param", () => {
      expect(new BigIntArithmetics(5.12).toCurrency("", { decimal: 2 })).toBe("5.12");
      expect(new BigIntArithmetics(80.865327).toCurrency("", { decimal: 2 })).toBe("80.87");
      expect(new BigIntArithmetics(33.432207).toCurrency("", { decimal: 2 })).toBe("33.43");
      expect(new BigIntArithmetics(999.999).toCurrency("$")).toBe("$1,000");
      expect(new BigIntArithmetics(0.0000000000000000000000000000001).toCurrency("", { decimal: 8 })).toBe("0");
    });

    test("zero value", () => {
      expect(new BigIntArithmetics(0).toCurrency("$")).toBe("$0");
      expect(new BigIntArithmetics(0).toCurrency("")).toBe("0");
    });

    test("custom decimal separator for small values", () => {
      expect(
        new BigIntArithmetics(0.015072).toCurrency("€", { currencyPosition: "end", decimal: 6, decimalSeparator: "," }),
      ).toBe("0,015072€");
    });
  });

  describe("comparison methods with edge cases", () => {
    test("handles comparison with different decimal precisions", () => {
      const num1 = new BigIntArithmetics({ decimal: 8, value: 1.00000001 });
      const num2 = new BigIntArithmetics({ decimal: 2, value: 1.0 });

      expect(num1.gt(num2)).toBe(true);
      expect(num2.lt(num1)).toBe(true);
    });

    test("handles zero comparisons", () => {
      const num = new BigIntArithmetics(0);

      expect(num.gt(0)).toBe(false);
      expect(num.lt(0)).toBe(false);
      expect(num.eqValue(0)).toBe(true);
      expect(num.gte(0)).toBe(true);
      expect(num.lte(0)).toBe(true);
    });

    test("handles negative number comparisons", () => {
      const num1 = new BigIntArithmetics(-10);
      const num2 = new BigIntArithmetics(-5);

      expect(num1.lt(num2)).toBe(true);
      expect(num2.gt(num1)).toBe(true);
    });
  });

  describe("set method", () => {
    test("creates new instance with updated value", () => {
      const num1 = new BigIntArithmetics({ decimal: 8, value: 100 });
      const num2 = num1.set(200);

      expect(num1.getValue("number")).toBe(100);
      expect(num2.getValue("number")).toBe(200);
      expect(num2.decimal).toBe(8);
    });

    test("preserves decimal in set", () => {
      const num1 = new BigIntArithmetics({ decimal: 6, value: 50 });
      const num2 = num1.set(75);

      expect(num2.decimal).toBe(6);
    });
  });

  describe("toSignificant edge cases", () => {
    test("handles very small numbers with leading zeros", () => {
      const num = new BigIntArithmetics(0.000000123456);
      expect(num.toSignificant(3)).toBe("0.000000123");
      expect(num.toSignificant(6)).toBe("0.000000123456");
    });

    test("handles numbers with all significant digits being zero", () => {
      const num = new BigIntArithmetics(0.0);
      expect(num.toSignificant(4)).toBe("0");
    });

    test("handles integers with toSignificant", () => {
      const num = new BigIntArithmetics(123000);
      expect(num.toSignificant(2)).toBe("120000");
      expect(num.toSignificant(3)).toBe("123000");
    });
  });

  describe("getBigIntValue", () => {
    test("handles BigIntArithmetics instance without decimal", () => {
      const num1 = new BigIntArithmetics(100);
      const num2 = new BigIntArithmetics(50);

      const bigIntValue = num1.getBigIntValue(num2);
      expect(typeof bigIntValue).toBe("bigint");
    });

    test("handles string '0' correctly", () => {
      const num = new BigIntArithmetics(100);
      const result = num.getBigIntValue("0");
      expect(result).toBe(0n);
    });

    test("handles undefined string correctly", () => {
      const num = new BigIntArithmetics(100);
      const result = num.getBigIntValue("undefined");
      expect(result).toBe(0n);
    });
  });
});
