import {
  buildDataCrazyTokensExpirationField,
  getDataCrazyEligibility,
  getDataCrazyPaymentStatus,
  sendDataCrazyStudentPayload,
  type DataCrazyDeliveryErrorCode,
  type DataCrazyEvent,
  type DataCrazySyncContext,
  type DataCrazyStudentPayload,
} from "@repo/datacrazy";
import { onlyDigits } from "@repo/utils";
import { createClient } from "@supabase/supabase-js";

const PLAN_LABELS: Record<string, string> = {
  internal_free_trial: "Free",
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

type DataCrazySyncErrorCode = DataCrazyDeliveryErrorCode
  | "STUDENT_STATE_FETCH_FAILED"
  | "PROFILE_NOT_FOUND"
  | "SUBSCRIPTION_NOT_FOUND"
  | "ESSAY_NOT_FOUND"
  | "PLAN_NOT_FOUND"
  | "PLAN_NOT_MAPPED"
  | "PAYMENT_STATUS_NOT_MAPPED"
  | "ESSAY_STATUS_NOT_MAPPED"
  | "UNKNOWN_ERROR";

class DataCrazySyncError extends Error {
  constructor(public readonly code: DataCrazySyncErrorCode) {
    super(code);
    this.name = "DataCrazySyncError";
  }
}

export function getDataCrazySyncErrorCode(error: unknown) {
  return error instanceof DataCrazySyncError ? error.code : "UNKNOWN_ERROR";
}

export async function syncStudentToDataCrazy(
  userId: string,
  event: DataCrazyEvent,
  context: DataCrazySyncContext = {}
): Promise<void> {
  const supabaseAdmin = createAdminClient();

  const subscriptionResult = await supabaseAdmin
    .from("subscriptions")
    .select("plan_id, status")
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

  const eligibility = getDataCrazyEligibility({
    event,
    currentPlanExternalId: plan.external_id,
    previousPlanExternalId: context.previousPlanExternalId,
    paymentAttempt: context.paymentAttempt,
  });

  console.info("[DATACRAZY_DEBUG]", {
    stage: "eligibility_checked",
    user_id: userId,
    event,
    eligible: eligibility.eligible,
    reason: eligibility.reason,
    current_plan_external_id: plan.external_id,
    previous_plan_external_id: context.previousPlanExternalId ?? null,
    payment_attempt: context.paymentAttempt ?? null,
  });

  if (!eligibility.eligible) {
    return;
  }

  const profileResult = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone_country_code, phone")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    console.error("[DATACRAZY_DEBUG]", {
      stage: "profile_fetch_failed",
      user_id: userId,
      event,
      supabase_error: {
        code: profileResult.error.code,
        message: profileResult.error.message,
        details: profileResult.error.details,
        hint: profileResult.error.hint,
      },
    });
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
    const allocationResult = await supabaseAdmin
      .from("free_credit_allocations")
      .select("expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (allocationResult.error) {
      throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
    }

    const planLabel = plan.external_id ? PLAN_LABELS[plan.external_id] : undefined;

    if (!planLabel) {
      throw new DataCrazySyncError("PLAN_NOT_MAPPED");
    }

    payload = {
      event,
      lead,
      plan: planLabel,
      ...buildDataCrazyTokensExpirationField(allocationResult.data?.expires_at),
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
      console.error("[DATACRAZY_DEBUG]", {
        stage: "essay_fetch_failed",
        user_id: userId,
        event,
        supabase_error: {
          code: essayResult.error.code,
          message: essayResult.error.message,
          details: essayResult.error.details,
          hint: essayResult.error.hint,
        },
      });
      throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
    }

    if (!essayResult.data) {
      throw new DataCrazySyncError("ESSAY_NOT_FOUND");
    }

    const essayStatus = ESSAY_STATUS_LABELS[essayResult.data.status];

    console.info("[DATACRAZY_DEBUG]", {
      stage: "essay_status_resolved",
      user_id: userId,
      event,
      internal_status: essayResult.data.status,
      mapped_status: essayStatus ?? null,
    });

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
    const paymentStatus =
      getDataCrazyPaymentStatus(context.paymentAttempt) ??
      PAYMENT_STATUS_LABELS[subscriptionResult.data.status];

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

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[DATACRAZY_DEBUG]", {
      stage: "admin_client_configuration_failed",
      has_supabase_url: Boolean(supabaseUrl),
      has_supabase_secret_key: Boolean(supabaseServiceKey),
    });
    throw new DataCrazySyncError("STUDENT_STATE_FETCH_FAILED");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
