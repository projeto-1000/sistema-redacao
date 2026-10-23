import assert from "node:assert/strict";
import test from "node:test";
import { scheduleRegistrationTask } from "./registration-task.ts";

function harness(task) {
  let scheduled;
  const errors = [];
  const eventId = scheduleRegistrationTask({
    userId: "created-user",
    schedule: (run) => {
      scheduled = run;
    },
    task,
    reportError: (code) => errors.push(code),
  });
  return { eventId, errors, run: () => scheduled() };
}

test("queue work starts after the account creation response, without delaying it", async () => {
  let queueWrites = 0;
  const tracking = harness(async () => {
    queueWrites++;
  });
  const accountResult = { success: true, eventId: tracking.eventId };
  assert.equal(accountResult.success, true);
  assert.equal(queueWrites, 0);
  await tracking.run();
  assert.equal(queueWrites, 1);
});

test("a failed queue insert does not reject the account response or the background task", async () => {
  const tracking = harness(async () => {
    throw new Error("database insert failed");
  });
  const accountResult = { success: true, eventId: tracking.eventId };
  await assert.doesNotReject(tracking.run());
  assert.deepEqual(accountResult, { success: true, eventId: "registration:created-user" });
  assert.deepEqual(tracking.errors, ["DELIVERY_FAILED"]);
});

test("a Meta request failure cannot reject the account result", async () => {
  let persisted = false;
  const tracking = harness(async () => {
    persisted = true;
    throw new Error("Meta unavailable");
  });
  await assert.doesNotReject(tracking.run());
  assert.equal(persisted, true);
  assert.equal(tracking.eventId, "registration:created-user");
  assert.deepEqual(tracking.errors, ["DELIVERY_FAILED"]);
});

test("failure to schedule tracking still returns the event id normally", () => {
  let ran = false;
  const errors = [];
  const eventId = scheduleRegistrationTask({
    userId: "created-user",
    schedule: () => {
      throw new Error("cannot schedule");
    },
    task: async () => {
      ran = true;
    },
    reportError: (code) => errors.push(code),
  });
  assert.equal(eventId, "registration:created-user");
  assert.equal(ran, false);
  assert.deepEqual(errors, ["SCHEDULING_FAILED"]);
});

test("even failure of the error reporter cannot propagate into signup", async () => {
  let run;
  assert.doesNotThrow(() =>
    scheduleRegistrationTask({
      userId: "created-user",
      schedule: (task) => {
        run = task;
      },
      task: async () => {
        throw new Error("tracking failed");
      },
      reportError: () => {
        throw new Error("logger failed");
      },
    })
  );
  await assert.doesNotReject(run());
});
