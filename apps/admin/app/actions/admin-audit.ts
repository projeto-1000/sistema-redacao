"use server";

import { createClient } from "@/lib/server";

export interface AdminAuditFilters {
  search?: string;
  actorId?: string;
  resourceType?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface AdminAuditEventItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  status: "pending" | "success" | "failure" | "operational_issue";
  summary: string;
  changes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
  subject: { id: string; full_name: string | null; email: string } | null;
}

function sanitizeSearch(value: string) {
  return value
    .replace(/[,%()]/g, " ")
    .trim()
    .slice(0, 120);
}

function getDateBoundary(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getAdminAuditEvents({
  filters = {},
  page = 1,
  limit = 20,
}: {
  filters?: AdminAuditFilters;
  page?: number;
  limit?: number;
} = {}): Promise<{
  events: AdminAuditEventItem[];
  totalPages: number;
  error: string | null;
}> {
  const supabase = await createClient();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const rangeStart = (safePage - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase.from("admin_audit_events").select(
    `
      id,
      action,
      resource_type,
      resource_id,
      status,
      summary,
      changes,
      metadata,
      created_at,
      actor:profiles!admin_audit_events_actor_id_fkey(full_name,email),
      subject:profiles!admin_audit_events_subject_id_fkey(id,full_name,email)
    `,
    { count: "exact" }
  );

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      `summary.ilike.%${search}%,action.ilike.%${search}%,resource_id.ilike.%${search}%`
    );
  }

  if (filters.resourceType && filters.resourceType !== "all") {
    query = query.eq("resource_type", filters.resourceType);
  }

  if (
    filters.actorId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      filters.actorId
    )
  ) {
    query = query.eq("actor_id", filters.actorId);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const from = getDateBoundary(filters.from);
  const to = getDateBoundary(filters.to, true);

  if (from) {
    query = query.gte("created_at", from);
  }

  if (to) {
    query = query.lte("created_at", to);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao carregar atividades administrativas:", error);
    return {
      events: [],
      totalPages: 0,
      error: "Não foi possível carregar as atividades administrativas.",
    };
  }

  return {
    events: (data ?? []).map((event) => ({
      ...event,
      changes: (event.changes ?? {}) as Record<string, unknown>,
      metadata: (event.metadata ?? {}) as Record<string, unknown>,
      actor: Array.isArray(event.actor) ? (event.actor[0] ?? null) : event.actor,
      subject: Array.isArray(event.subject) ? (event.subject[0] ?? null) : event.subject,
    })) as AdminAuditEventItem[],
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
  };
}

export async function getAdminAuditActors() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("role", "ADMIN")
    .order("full_name");

  if (error) {
    console.error("Erro ao carregar administradores para o filtro:", error);
    return [];
  }

  return data ?? [];
}
