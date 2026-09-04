import "server-only";

import { createAdminClient } from "@/lib/admin";
import {
  sendDataCrazyStudentPayload,
  type DataCrazyDeliveryErrorCode,
  type DataCrazyEvent,
  type DataCrazyStudentPayload,
} from "@repo/datacrazy";
import { onlyDigits } from "@repo/utils";

const PLAN_LABELS_BY_EXTERNAL_ID: Record<string, string> = {
  internal_free_trial: "Free",
  internal_mentoria_free: "Mentoria",
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
  corrected: "Corrigida",
};

type DataCrazySyncErrorCode =
  | DataCrazyDeliveryErrorCode
  | "STUDENT_STATE_FETCH_FAILED"
  | "PROFILE_NOT_FOUND"
  | "SUBSCRIPTION_NOT_FOUND"
  | "ESSAY_NOT_FOUND"
  | "PLAN_NOT_FOUND"
  | "PLAN_NOT_MAPPED"
  | "PAYMENT_STATUS_NOT_MAPPED"
  | "ESSAY_STATUS_NOT_MAPPED"
  | "UNKNOWN_ERROR";

export type { DataCrazyEvent, DataCrazyStudentPayload } from "@repo/datacrazy";

export class DataCrazySyncError extends Error {
  constructor(public readonly code: DataCrazySyncErrorCode) {
    super(code);
    this.name = "DataCrazySyncError";
  }
}

export function getDataCrazySyncErrorCode(error: unknown) {
  return error instanceof DataCrazySyncError ? error.code : "UNKNOWN_ERROR";
}

export async function syncStudentToDataCrazy(userId: string, event: DataCrazyEvent): Promise<void> {
  const supabaseAdmin = createAdminClient();

  const profileResult = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone_country_code, phone")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
  }

  if (!profileResult.data) {
    throw new DataCrazySyncError("PROFILE_NOT_FOUND");
  }

  const lead = {
    name: profileResult.data.full_name ?? "",
    phone: `${onlyDigits(profileResult.data.phone_country_code)}${onlyDigits(
      profileResult.data.phone
    )}`,
  };

  let payload: DataCrazyStudentPayload;

  if (event === "user_signup" || event === "subscription_updated") {
    const [subscriptionResult, allocationResult] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("plan_id")
        .eq("user_id", userId)
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

    if (subscriptionResult.error || allocationResult.error) {
      throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
    }

    if (!subscriptionResult.data) {
      throw new DataCrazySyncError("SUBSCRIPTION_NOT_FOUND");
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("name, external_id")
      .eq("id", subscriptionResult.data.plan_id)
      .maybeSingle();

    if (planError) {
      throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
    }

    if (!plan) {
      throw new DataCrazySyncError("PLAN_NOT_FOUND");
    }

    const internalPlanLabel = PLAN_LABELS_BY_EXTERNAL_ID[plan.external_id];

    const planLabel =
      internalPlanLabel ??
      (plan.name === "Essencial" ? "Essencial" : plan.name === "Avançado" ? "Avançado" : null);

    if (!planLabel) {
      throw new DataCrazySyncError("PLAN_NOT_MAPPED");
    }

    payload = {
      event,
      lead,
      plan: planLabel,
      ...(allocationResult.data?.expires_at
        ? { tokens_expire_at: allocationResult.data.expires_at }
        : {}),
    };
  } else if (event === "essay_status_updated") {
    const essayResult = await supabaseAdmin
      .from("essays")
      .select("status, total_score")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (essayResult.error) {
      throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
    }

    if (!essayResult.data) {
      throw new DataCrazySyncError("ESSAY_NOT_FOUND");
    }

    const essayStatus = ESSAY_STATUS_LABELS[essayResult.data.status];

    if (!essayStatus) {
      throw new DataCrazySyncError("ESSAY_STATUS_NOT_MAPPED");
    }

    payload = {
      event,
      lead,
      essay_status: essayStatus,
      ...(essayResult.data.total_score !== null
        ? { last_essay_score: essayResult.data.total_score }
        : {}),
    };
  } else {
    const subscriptionResult = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionResult.error) {
      throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
    }

    if (!subscriptionResult.data) {
      throw new DataCrazySyncError("SUBSCRIPTION_NOT_FOUND");
    }

    const paymentStatus = PAYMENT_STATUS_LABELS[subscriptionResult.data.status];

    if (!paymentStatus) {
      throw new DataCrazySyncError("PAYMENT_STATUS_NOT_MAPPED");
    }

    payload = {
      event,
      lead,
      payment_status: paymentStatus,
    };
  }

  const deliveryResult = await sendDataCrazyStudentPayload(payload);

  if (!deliveryResult.ok) {
    throw new DataCrazySyncError(deliveryResult.errorCode);
  }
}
