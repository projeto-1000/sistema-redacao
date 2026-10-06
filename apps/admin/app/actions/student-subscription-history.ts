"use server";

import { createClient } from "@/lib/server";
import { buildSubscriptionHistoryResult } from "@repo/utils";
import type { SubscriptionHistoryRpcRow } from "@repo/types";

export async function getStudentSubscriptionHistory(studentId: string, page = 1) {
  try {
    const client = await createClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    const { data: role, error: roleError } = await client.rpc("get_my_role");
    if (!user || userError || roleError || role !== "ADMIN")
      throw new Error("Sessão administrativa inválida.");
    const { data, error } = await client.rpc("get_subscription_history_events", {
      p_user_id: studentId,
      p_page: page,
      p_limit: 10,
    });
    if (error) throw new Error("Não foi possível carregar o histórico do aluno.");
    const rows = (data ?? []) as SubscriptionHistoryRpcRow[];
    const ids = rows.flatMap((row) =>
      row.metadata?.adjustment_kind === "withdrawal_hold_release" &&
      typeof row.metadata.withdrawal_request_id === "string"
        ? [row.metadata.withdrawal_request_id]
        : []
    );
    if (ids.length) {
      const requests = await client
        .from("subscription_withdrawal_requests")
        .select("id,reviewed_at,review_reason")
        .eq("student_id", studentId)
        .eq("status", "rejected")
        .in("id", ids);
      if (requests.error)
        throw new Error("Não foi possível carregar os detalhes dos cancelamentos anteriores.");
      for (const row of rows) {
        const request = requests.data?.find(
          (item) => item.id === row.metadata?.withdrawal_request_id
        );
        if (request)
          row.metadata = {
            ...row.metadata,
            withdrawal_reviewed_at: request.reviewed_at,
            withdrawal_review_reason: request.review_reason,
          };
      }
    }
    return { ...buildSubscriptionHistoryResult({ rows }), error: null };
  } catch (error) {
    return {
      items: [],
      totalPages: 0,
      error: {
        message: error instanceof Error ? error.message : "Não foi possível carregar o histórico.",
      },
    };
  }
}
