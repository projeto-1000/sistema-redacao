"use server";

import { createClient } from "@/lib/server";

export interface CancellationHistoryEntry {
  id: string;
  student_id: string;
  kind: "withdrawal" | "ordinary";
  status: string;
  requested_at: string;
  last_activity_at: string;
  effective_at: string | null;
  refund_started_at: string | null;
  refund_completed_at: string | null;
  cancellation_reason: string | null;
  cancellation_details: string | null;
  snapshot: {
    student_name: string | null;
    student_email: string | null;
    plan_name: string | null;
    amount: number | null;
    paid_at: string | null;
    credits_granted: number | null;
    credits_used: number | null;
    historical_reconstruction: boolean;
  };
  events: { label: string; at: string; detail?: string | null }[];
}

export async function listCancellationHistory(): Promise<CancellationHistoryEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sessão administrativa inválida.");
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || role !== "ADMIN")
    throw new Error("Você não tem permissão para consultar cancelamentos.");
  // Authenticated client + ADMIN-only RLS; never a browser service-role client.
  const entries: CancellationHistoryEntry[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("subscription_cancellation_history")
      .select("*")
      .order("requested_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error("[CANCELLATION_HISTORY_ERROR]", error.code);
      if (error.code === "42P01" || error.code === "PGRST205") {
        throw new Error("A atualização do banco para o novo histórico ainda não foi aplicada. Os registros anteriores não foram apagados.");
      }
      throw new Error("Não foi possível carregar o histórico de cancelamentos.");
    }
    entries.push(...(data as CancellationHistoryEntry[]));
    if (data.length < pageSize) break;
  }
  return entries;
}
