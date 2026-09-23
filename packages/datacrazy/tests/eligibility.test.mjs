import assert from "node:assert/strict";
import test from "node:test";

import {
  getDataCrazyEligibility,
  getDataCrazyPaymentStatus,
} from "../src/eligibility.ts";

const FREE_PLAN = "internal_free_trial";
const ESSENTIAL_PLAN = "plan_essential";
const ADVANCED_PLAN = "plan_advanced";

function isEligible(input) {
  return getDataCrazyEligibility(input).eligible;
}

test("Free student is eligible for a new draft event", () => {
  assert.equal(
    isEligible({
      event: "essay_status_updated",
      currentPlanExternalId: FREE_PLAN,
    }),
    true,
  );
});

test("updating the same draft remains suppressed by the action trigger", () => {
  const createdNewDraft = false;
  const eligibleForPlan = isEligible({
    event: "essay_status_updated",
    currentPlanExternalId: FREE_PLAN,
  });

  assert.equal(createdNewDraft && eligibleForPlan, false);
});

test("Free student is eligible for submitted and corrected essay events", () => {
  for (const essayStatus of [
    "pending",
    "corrected_by_teacher",
    "corrected_by_admin",
  ]) {
    assert.equal(
      isEligible({
        event: "essay_status_updated",
        currentPlanExternalId: FREE_PLAN,
      }),
      true,
      essayStatus,
    );
  }
});

test("paid students are not eligible for essay events", () => {
  for (const currentPlanExternalId of [ESSENTIAL_PLAN, ADVANCED_PLAN]) {
    assert.equal(
      isEligible({ event: "essay_status_updated", currentPlanExternalId }),
      false,
    );
  }
});

test("Free to Essential and Free to Advanced transitions are eligible", () => {
  for (const currentPlanExternalId of [ESSENTIAL_PLAN, ADVANCED_PLAN]) {
    assert.equal(
      isEligible({
        event: "subscription_updated",
        currentPlanExternalId,
        previousPlanExternalId: FREE_PLAN,
      }),
      true,
    );
  }
});

test("paid plan changes and later subscription updates are not eligible", () => {
  assert.equal(
    isEligible({
      event: "subscription_updated",
      currentPlanExternalId: ADVANCED_PLAN,
      previousPlanExternalId: ESSENTIAL_PLAN,
    }),
    false,
  );

  assert.equal(
    isEligible({
      event: "subscription_updated",
      currentPlanExternalId: ESSENTIAL_PLAN,
    }),
    false,
  );
});

test("initial refused payment while still Free is eligible as Recusado", () => {
  assert.equal(
    isEligible({
      event: "payment_status_updated",
      currentPlanExternalId: FREE_PLAN,
      paymentAttempt: "initial_refused",
    }),
    true,
  );
  assert.equal(getDataCrazyPaymentStatus("initial_refused"), "Recusado");
});

test("initial approved payment does not require a payment status event", () => {
  assert.equal(
    isEligible({
      event: "payment_status_updated",
      currentPlanExternalId: FREE_PLAN,
    }),
    false,
  );
});

test("refused renewal for a paid student is not eligible", () => {
  assert.equal(
    isEligible({
      event: "payment_status_updated",
      currentPlanExternalId: ESSENTIAL_PLAN,
    }),
    false,
  );
});

test("approved renewal for a paid student is not eligible", () => {
  assert.equal(
    isEligible({
      event: "payment_status_updated",
      currentPlanExternalId: ADVANCED_PLAN,
    }),
    false,
  );
});

test("Mentoria is not eligible for the Free acquisition funnel", () => {
  assert.equal(
    isEligible({
      event: "user_signup",
      currentPlanExternalId: "internal_mentoria_free",
    }),
    false,
  );

  assert.equal(
    isEligible({
      event: "subscription_updated",
      currentPlanExternalId: "internal_mentoria_free",
      previousPlanExternalId: FREE_PLAN,
    }),
    false,
  );

  assert.equal(
    isEligible({
      event: "payment_status_updated",
      currentPlanExternalId: "internal_mentoria_free",
      paymentAttempt: "initial_refused",
    }),
    false,
  );
});
