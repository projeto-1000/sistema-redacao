import { createAdminClient } from "@/lib/admin";
import type { LocalSubscriptionReconciliationState } from "./policy";
import { selectDueReconciliationCandidates } from "./queue";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function listDuePagarmeSubscriptionCandidates({
  supabaseAdmin,
  now,
  limit,
}: {
  supabaseAdmin: AdminClient;
  now: Date;
  limit: number;
}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limite de reconciliação inválido.");
  }

  const nowIso = now.toISOString();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, external_id, status, current_period_start, current_period_end, next_billing_at, metadata, updated_at"
    )
    .in("status", ["active", "trial", "past_due"])
    .like("external_id", "sub_%")
    .or(`current_period_end.lt.${nowIso},status.eq.past_due`)
    .or(
      `metadata->>reconciliation_retry_after.is.null,metadata->>reconciliation_retry_after.lte.${nowIso}`
    )
    .order("current_period_end", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error("Não foi possível localizar assinaturas para reconciliação.");
  }

  return selectDueReconciliationCandidates(
    (data ?? []) as LocalSubscriptionReconciliationState[],
    now,
    limit
  );
}
