import assert from "node:assert/strict";
import test from "node:test";

import { getFirstName } from "../src/format-name.ts";

test("returns the first name from a full name", () => {
  assert.equal(getFirstName("Fernanda Felix"), "Fernanda");
});

test("keeps a single name unchanged", () => {
  assert.equal(getFirstName("Fernanda"), "Fernanda");
});

test("ignores extra whitespace", () => {
  assert.equal(getFirstName("  Fernanda   Felix  "), "Fernanda");
});

test("returns an empty string for an empty name", () => {
  assert.equal(getFirstName(""), "");
});

test("returns an empty string for null", () => {
  assert.equal(getFirstName(null), "");
});

test("returns an empty string for undefined", () => {
  assert.equal(getFirstName(undefined), "");
});
