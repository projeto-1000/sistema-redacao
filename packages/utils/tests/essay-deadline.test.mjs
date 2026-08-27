import assert from "node:assert/strict";
import test from "node:test";

import { getDeadlineStatus } from "../src/essay-deadline.ts";

test("formats a newly submitted essay as approximately 48 business hours", () => {
  const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  assert.deepEqual(
    getDeadlineStatus(futureDeadline.toISOString(), 48 * 60 * 60 - 1),
    { status: "normal", label: "EM DIA", text: "48h" }
  );
});

test("uses business hours for warning thresholds", () => {
  const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

  assert.equal(
    getDeadlineStatus(futureDeadline.toISOString(), 12 * 60 * 60).status,
    "warning"
  );
  assert.equal(
    getDeadlineStatus(futureDeadline.toISOString(), 6 * 60 * 60).status,
    "urgent"
  );
});

test("marks an essay late only after its persisted deadline", () => {
  const pastDeadline = new Date(Date.now() - 1000);

  assert.deepEqual(getDeadlineStatus(pastDeadline.toISOString(), -1), {
    status: "expired",
    label: "ATRASADA",
    text: "Vencido",
  });
});
