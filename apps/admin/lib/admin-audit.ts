import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/server";

interface RecordAdminAuditEventInput {
  operationId?: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  subjectId?: string | null;
  status?: "pending" | "success" | "failure" | "operational_issue";
  summary: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function recordAdminAuditEvent({
  operationId = randomUUID(),
  action,
  resourceType,
  resourceId = null,
  subjectId = null,
  status = "success",
  summary,
  changes = {},
  metadata = {},
}: RecordAdminAuditEventInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_admin_audit_event", {
    p_operation_id: operationId,
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_subject_id: subjectId,
    p_status: status,
    p_summary: summary,
    p_changes: changes,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error("Não foi possível registrar a atividade administrativa.");
  }

  return data as string;
}
