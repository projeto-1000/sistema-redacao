import assert from "node:assert/strict";
import test from "node:test";

import { getMonthlyEquivalentCents } from "../src/plan-pricing.ts";

test("calculates a quarterly monthly-equivalent price", () => {
  assert.equal(getMonthlyEquivalentCents(12_725, 3), 4_242);
});

test("rounds another independent quarterly offer", () => {
  assert.equal(getMonthlyEquivalentCents(22_925, 3), 7_642);
});

test("rejects invalid billing periods", () => {
  assert.throws(() => getMonthlyEquivalentCents(12_725, 0));
});
