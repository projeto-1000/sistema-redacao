import assert from "node:assert/strict";
import test from "node:test";
import {
  isDataCrazySyncEnabled,
  runDataCrazySyncIfEnabled,
} from "./sync-enabled.js";

test("keeps Data Crazy sync enabled when the env is absent", () => {
  assert.equal(isDataCrazySyncEnabled(undefined), true);
});

test("keeps Data Crazy sync enabled when the env is true", () => {
  assert.equal(isDataCrazySyncEnabled("true"), true);
});

test("disables Data Crazy sync only when the env is false", async () => {
  let externalOperationCalls = 0;

  await runDataCrazySyncIfEnabled(async () => {
    externalOperationCalls += 1;
  }, "false");

  assert.equal(isDataCrazySyncEnabled("false"), false);
  assert.equal(externalOperationCalls, 0);
});
