import { describe, expect, test } from "bun:test";

import type { DerivationPathArray } from "../../types";
import { derivationPathToString } from "../derivationPath";

describe("derivationPathToString", () => {
  test("should return the correct string for a full path", () => {
    const path = [1, 2, 3, 4, 5] as DerivationPathArray;
    expect(derivationPathToString(path)).toEqual("m/1'/2'/3'/4/5");
  });

  test("should return the correct string for a short path", () => {
    const path = [1, 2, 3, 4] as DerivationPathArray;
    expect(derivationPathToString(path)).toEqual("m/1'/2'/3'/4");
  });
});
