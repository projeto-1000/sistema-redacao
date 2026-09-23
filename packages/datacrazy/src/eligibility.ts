export const DATA_CRAZY_FREE_PLAN_EXTERNAL_ID = "internal_free_trial";
export const DATA_CRAZY_MENTORSHIP_PLAN_EXTERNAL_ID = "internal_mentoria_free";

export type DataCrazyEvent =
  | "user_signup"
  | "essay_status_updated"
  | "subscription_updated"
  | "payment_status_updated";

export type DataCrazyEligibilityReason =
  | "current_plan_is_free"
  | "free_to_paid_transition"
  | "initial_payment_refused_while_free"
  | "current_plan_is_not_free"
  | "transition_did_not_start_from_free"
  | "payment_event_not_eligible";

export type DataCrazySyncContext = {
  previousPlanExternalId?: string | null;
  paymentAttempt?: "initial_refused";
};

export type DataCrazyEligibilityDecision = {
  eligible: boolean;
  reason: DataCrazyEligibilityReason;
};

export function getDataCrazyEligibility({
  event,
  currentPlanExternalId,
  previousPlanExternalId,
  paymentAttempt,
}: {
  event: DataCrazyEvent;
  currentPlanExternalId: string | null;
} & DataCrazySyncContext): DataCrazyEligibilityDecision {
  if (event === "user_signup" || event === "essay_status_updated") {
    const eligible = currentPlanExternalId === DATA_CRAZY_FREE_PLAN_EXTERNAL_ID;

    return {
      eligible,
      reason: eligible ? "current_plan_is_free" : "current_plan_is_not_free",
    };
  }

  if (event === "subscription_updated") {
    const eligible =
      previousPlanExternalId === DATA_CRAZY_FREE_PLAN_EXTERNAL_ID &&
      currentPlanExternalId !== null &&
      currentPlanExternalId !== DATA_CRAZY_FREE_PLAN_EXTERNAL_ID &&
      currentPlanExternalId !== DATA_CRAZY_MENTORSHIP_PLAN_EXTERNAL_ID;

    return {
      eligible,
      reason: eligible
        ? "free_to_paid_transition"
        : "transition_did_not_start_from_free",
    };
  }

  const eligible =
    currentPlanExternalId === DATA_CRAZY_FREE_PLAN_EXTERNAL_ID &&
    paymentAttempt === "initial_refused";

  return {
    eligible,
    reason: eligible
      ? "initial_payment_refused_while_free"
      : "payment_event_not_eligible",
  };
}

export function getDataCrazyPaymentStatus(
  paymentAttempt: DataCrazySyncContext["paymentAttempt"],
): "Recusado" | null {
  return paymentAttempt === "initial_refused" ? "Recusado" : null;
}
