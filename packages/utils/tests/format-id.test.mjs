import assert from "node:assert/strict";
import test from "node:test";

import { formatShortId } from "../src/format-id.ts";

test("returns the first eight characters from an ID", () => {
  assert.equal(
    formatShortId("a985011c-3f9d-4d1a-8b31-dc2c735ec25f"),
    "a985011c",
  );
});
