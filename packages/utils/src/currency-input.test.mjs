import assert from "node:assert/strict";
import test from "node:test";
import { formatCurrencyInput, parseCurrencyInput } from "./currency-input.ts";

test("formats centavos as Brazilian currency input", () => {
  assert.equal(formatCurrencyInput(123456), "1.234,56");
  assert.equal(formatCurrencyInput(20), "0,20");
  assert.equal(formatCurrencyInput(0), "0,00");
  assert.equal(formatCurrencyInput(null), "");
});

test("handles bank-style digits, paste and clearing without accepting invalid amounts", () => {
  assert.equal(parseCurrencyInput("2000"), 2000);
  assert.equal(parseCurrencyInput("R$ 1.234,56"), 123456);
  assert.equal(parseCurrencyInput("0,20"), 20);
  assert.equal(parseCurrencyInput(""), null);
  for (const value of ["-20", "1e3", "abc", "9999999999999"])
    assert.equal(parseCurrencyInput(value), null);
});
