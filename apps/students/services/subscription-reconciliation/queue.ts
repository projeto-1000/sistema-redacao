import type { LocalSubscriptionReconciliationState } from "./policy.js";

const RECONCILIATION_BACKOFF_MS = [
  2 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
] as const;

function getAttemptCount(metadata: Record<string, unknown> | null) {
  const value = metadata?.reconciliation_attempt_count;

  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

export function isReconciliationRetryDue(
  metadata: Record<string, unknown> | null,
  now: Date
) {
  const retryAfter = metadata?.reconciliation_retry_after;

  if (typeof retryAfter !== "string") {
    return true;
  }

  const retryAt = new Date(retryAfter).getTime();

  return !Number.isFinite(retryAt) || retryAt <= now.getTime();
}

export function selectDueReconciliationCandidates(
  candidates: LocalSubscriptionReconciliationState[],
  now: Date,
  limit: number
) {
  return candidates
    .filter((candidate) => isReconciliationRetryDue(candidate.metadata, now))
    .slice(0, limit);
}

export function buildReconciliationAttemptMetadata(
  metadata: Record<string, unknown> | null,
  now: Date
) {
  const attemptCount = getAttemptCount(metadata) + 1;
  const backoffIndex = Math.min(attemptCount - 1, RECONCILIATION_BACKOFF_MS.length - 1);
  const retryAfter = new Date(
    now.getTime() + RECONCILIATION_BACKOFF_MS[backoffIndex]!
  );

  return {
    ...(metadata ?? {}),
    reconciliation_attempt_count: attemptCount,
    reconciliation_last_attempt_at: now.toISOString(),
    reconciliation_retry_after: retryAfter.toISOString(),
  };
}

export function shouldReopenProcessedReconciliationEvent({
  status,
  stateNeedsApplication,
}: {
  status: string;
  stateNeedsApplication: boolean;
}) {
  return status === "processed" && stateNeedsApplication;
}
