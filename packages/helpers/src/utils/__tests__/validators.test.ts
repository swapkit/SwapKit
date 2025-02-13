import { describe, expect, test } from "bun:test";
import { validateTNS } from "../validators";

describe("validateTNS", () => {
  const casesWithExpectation: [string, boolean][] = [
    ["validname", true],
    ["valid-name", true],
    ["valid_name", true],
    ["valid+name", true],
    ["name_with_numbers123", true],
    ["UPPER_CASE", true],
    ["toolongname123456789012345678901", false],
    ["invalid@name", false],
    ["invalid!name", false],
    ["invalid#name", false],
  ];

  for (const [name, expected] of casesWithExpectation) {
    test(`returns ${expected} for THORName "${name}"`, () => {
      const result = validateTNS(name);
      expect(result).toBe(expected);
    });
  }
});
