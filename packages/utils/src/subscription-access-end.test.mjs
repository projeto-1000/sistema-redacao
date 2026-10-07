import assert from "node:assert/strict";
import test from "node:test";
import { getSubscriptionAccessEnd } from "./subscription-access-end.ts";

test("UTC 23:59 ends at 23:59 Brasília on the same local day", () => {
  assert.equal(
    getSubscriptionAccessEnd("2026-10-24T23:59:59Z"),
    "2026-10-25T02:59:59.999Z",
  );
});
test("uses the São Paulo calendar day and is idempotent", () => {
  const end = getSubscriptionAccessEnd("2026-10-25T01:00:00Z");
  assert.equal(end, "2026-10-25T02:59:59.999Z");
  assert.equal(getSubscriptionAccessEnd(end), end);
});
test("rejects invalid timestamps", () => {
  assert.throws(() => getSubscriptionAccessEnd("invalid"));
});
