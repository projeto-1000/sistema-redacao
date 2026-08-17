import "server-only";

import { createAdminClient } from "@/lib/admin";
import { onlyDigits } from "@repo/utils";

const DATACRAZY_REQUEST_TIMEOUT_MS = 5_000;

const PLAN_LABELS: Record<string, string> = {
  internal_free_trial: "Grátis",
  essential: "Essencial",
  advanced: "Avançado",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  trial: "Ativo",
  past_due: "Pendente",
  unpaid: "Inadimplente",
  canceled: "Cancelado",
};

const ESSAY_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  pending: "Enviada",
  correcting: "Em correção",
  corrected: "Corrigida",
  returned: "Devolvida",
};

type DataCrazySyncErrorCode =
  | "WEBHOOK_NOT_CONFIGURED"
  | "WEBHOOK_URL_INVALID"
  | "STUDENT_STATE_FETCH_FAILED"
  | "PROFILE_NOT_FOUND"
  | "SUBSCRIPTION_NOT_FOUND"
  | "PLAN_NOT_FOUND"
  | "PLAN_NOT_MAPPED"
  | "PAYMENT_STATUS_NOT_MAPPED"
  | "ESSAY_STATUS_NOT_MAPPED"
  | "WEBHOOK_REQUEST_FAILED"
  | "WEBHOOK_RESPONSE_FAILED"
  | "UNKNOWN_ERROR";

export interface DataCrazyStudentPayload {
  lead: {
    name: string;
    phone: string;
  };
  plan: string;
  essay_status: string;
  payment_status: string;
  last_essay_score: number | null;
  tokens_expire_at: string | null;
}

export class DataCrazySyncError extends Error {
  constructor(public readonly code: DataCrazySyncErrorCode) {
    super(code);
    this.name = "DataCrazySyncError";
  }
}

export function getDataCrazySyncErrorCode(error: unknown) {
  return error instanceof DataCrazySyncError ? error.code : "UNKNOWN_ERROR";
}

export async function syncStudentToDataCrazy(userId: string): Promise<void> {
  const webhookUrl = getWebhookUrl();
  const supabaseAdmin = createAdminClient();

  const [profileResult, subscriptionResult, essayResult, allocationResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name, phone_country_code, phone")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("essays")
      .select("status, total_score")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("free_credit_allocations")
      .select("expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (
    profileResult.error ||
    subscriptionResult.error ||
    essayResult.error ||
    allocationResult.error
  ) {
    throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
  }

  if (!profileResult.data) {
    throw new DataCrazySyncError("PROFILE_NOT_FOUND");
  }

  if (!subscriptionResult.data) {
    throw new DataCrazySyncError("SUBSCRIPTION_NOT_FOUND");
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select("external_id")
    .eq("id", subscriptionResult.data.plan_id)
    .maybeSingle();

  if (planError) {
    throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
  }

  if (!plan) {
    throw new DataCrazySyncError("PLAN_NOT_FOUND");
  }

  const planLabel = plan.external_id ? PLAN_LABELS[plan.external_id] : undefined;
  const paymentStatus = PAYMENT_STATUS_LABELS[subscriptionResult.data.status];
  const essayStatus = essayResult.data ? ESSAY_STATUS_LABELS[essayResult.data.status] : "Rascunho";

  if (!planLabel) {
    throw new DataCrazySyncError("PLAN_NOT_MAPPED");
  }

  if (!paymentStatus) {
    throw new DataCrazySyncError("PAYMENT_STATUS_NOT_MAPPED");
  }

  if (!essayStatus) {
    throw new DataCrazySyncError("ESSAY_STATUS_NOT_MAPPED");
  }

  const payload: DataCrazyStudentPayload = {
    lead: {
      name: profileResult.data.full_name ?? "",
      phone: `${onlyDigits(profileResult.data.phone_country_code)}${onlyDigits(
        profileResult.data.phone
      )}`,
    },
    plan: planLabel,
    essay_status: essayStatus,
    payment_status: paymentStatus,
    last_essay_score: essayResult.data?.total_score ?? null,
    tokens_expire_at: allocationResult.data?.expires_at ?? null,
  };

  let response: Response;

  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(DATACRAZY_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new DataCrazySyncError("WEBHOOK_REQUEST_FAILED");
  }

  if (!response.ok) {
    throw new DataCrazySyncError("WEBHOOK_RESPONSE_FAILED");
  }
}

function getWebhookUrl() {
  const configuredUrl = process.env.DATACRAZY_WEBHOOK_URL;

  if (!configuredUrl) {
    throw new DataCrazySyncError("WEBHOOK_NOT_CONFIGURED");
  }

  try {
    const url = new URL(configuredUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported protocol");
    }

    return url.toString();
  } catch {
    throw new DataCrazySyncError("WEBHOOK_URL_INVALID");
  }
}
