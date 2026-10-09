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
    const manualGrantIds = rows.flatMap((row) =>
      row.metadata?.source === "manual_credit_grant" &&
      typeof row.metadata.manual_credit_grant_id === "string"
        ? [row.metadata.manual_credit_grant_id]
        : []
    );

    if (manualGrantIds.length) {
      const grants = await client
        .from("manual_credit_grants")
        .select("id,administrator_id,internal_note")
        .eq("student_id", studentId)
        .in("id", manualGrantIds);

      if (grants.error) {
        throw new Error("Não foi possível carregar a auditoria dos créditos adicionados.");
      }

      const administratorIds = [
        ...new Set((grants.data ?? []).map((grant) => grant.administrator_id)),
      ];
      const administrators = administratorIds.length
        ? await client.from("profiles").select("id,full_name").in("id", administratorIds)
        : { data: [], error: null };

      if (administrators.error) {
        throw new Error("Não foi possível identificar os administradores responsáveis.");
      }

      const administratorNames = new Map(
        (administrators.data ?? []).map((administrator) => [
          administrator.id,
          administrator.full_name?.trim() || "Administrador não identificado",
        ])
      );

      for (const row of rows) {
        const grant = grants.data?.find((item) => item.id === row.metadata?.manual_credit_grant_id);

        if (grant) {
          row.metadata = {
            ...row.metadata,
            administrator_name:
              administratorNames.get(grant.administrator_id) ?? "Administrador não identificado",
            internal_note: grant.internal_note,
          };
        }
      }
    }

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
