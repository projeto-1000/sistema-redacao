import assert from "node:assert/strict";
import test from "node:test";
import { courtesyDateToIso, parseRefundAmount } from "./subscription-support.js";

test("parses centavos without rounding unapproved precision", () => {
  assert.equal(parseRefundAmount("89,90"), 8990);
  assert.equal(parseRefundAmount("20.1"), 2010);
  for (const invalid of ["-10", "1,001", "1e3", "R$ 20", "", "1.000,00"]) {
    assert.equal(parseRefundAmount(invalid), null);
  }
});

test("uses the end of the Sao Paulo calendar day, including legacy period timestamps", () => {
  assert.equal(courtesyDateToIso("2026-11-01"), "2026-11-02T02:59:59.000Z");
  const end = "2026-11-02T23:59:59.000Z";
  assert.equal(courtesyDateToIso("2026-11-02", end), "2026-11-03T02:59:59.000Z");
  assert.equal(courtesyDateToIso("not-a-date"), undefined);
  assert.equal(courtesyDateToIso("2026-02-30"), undefined);
});
