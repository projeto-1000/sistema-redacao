import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDataCrazyTokensExpirationField,
  formatDataCrazyDateInSaoPaulo,
} from "../src/date.ts";

test("formats the previous civil day in America/Sao_Paulo", () => {
  assert.equal(
    formatDataCrazyDateInSaoPaulo("2026-09-27T02:59:59.999999+00:00"),
    "2026-09-26",
  );
});

test("keeps the same civil day when the UTC time is after the offset", () => {
  assert.equal(
    formatDataCrazyDateInSaoPaulo("2026-09-27T15:00:00.000Z"),
    "2026-09-27",
  );
});

test("omits tokens_expire_at when the source value is absent", () => {
  assert.deepEqual(buildDataCrazyTokensExpirationField(null), {});
  assert.deepEqual(buildDataCrazyTokensExpirationField(undefined), {});
});

test("preserves the user_signup payload and formats only tokens_expire_at", () => {
  const payload = {
    event: "user_signup",
    lead: {
      name: "Test Student",
      phone: "5500000000000",
    },
    plan: "Free",
    ...buildDataCrazyTokensExpirationField(
      "2026-09-27T02:59:59.999999+00:00",
    ),
  };

  assert.deepEqual(payload, {
    event: "user_signup",
    lead: {
      name: "Test Student",
      phone: "5500000000000",
    },
    plan: "Free",
    tokens_expire_at: "2026-09-26",
  });
});
