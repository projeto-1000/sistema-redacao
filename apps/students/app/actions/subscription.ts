import { createClient } from "@/lib/server";
import type {
  CreditTransaction,
  CreditsFilters,
  HistoryDisplayItem,
  SubscriptionHistoryRpcRow,
} from "@repo/types";
import { buildSubscriptionHistoryResult } from "@repo/utils";

import { PostgrestError } from "@supabase/supabase-js";

interface GetCreditsHistoryParams {
  filters?: CreditsFilters;
  page?: number;
  limit?: number;
}

export async function getSubscriptionHistory({
  filters,
  page = 1,
  limit = 10,
}: GetCreditsHistoryParams = {}): Promise<{
  items: HistoryDisplayItem[];
  totalPages: number;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase.rpc("get_subscription_history_events", {
      /*
       * A RPC usa auth.uid() quando
       * p_user_id é nulo.
       */
      p_user_id: null,

      p_page: page,
      p_limit: limit,

      p_transaction_type: filters?.type ?? null,

      p_from: filters?.from ?? null,

      p_to: filters?.to ?? null,
    });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as SubscriptionHistoryRpcRow[];
    const rejectedRequestIds = Array.from(
      new Set(
        rows.flatMap((row) => {
          const metadata = row.metadata;

          return metadata?.adjustment_kind === "withdrawal_hold_release" &&
            typeof metadata.withdrawal_request_id === "string"
            ? [metadata.withdrawal_request_id]
            : [];
        })
      )
    );
    const rejectionDetails = new Map<
      string,
      { reviewed_at: string | null; review_reason: string | null }
    >();

    if (rejectedRequestIds.length > 0) {
      const { data: rejectedRequests, error: rejectedRequestsError } = await supabase
        .from("subscription_withdrawal_requests")
        .select("id, reviewed_at, review_reason")
        .eq("student_id", user.id)
        .eq("status", "rejected")
        .in("id", rejectedRequestIds);

      if (rejectedRequestsError) {
        console.error("[GET_WITHDRAWAL_REJECTION_DETAILS_ERROR]", rejectedRequestsError);
      } else {
        for (const request of rejectedRequests ?? []) {
          rejectionDetails.set(request.id, {
            reviewed_at: request.reviewed_at,
            review_reason: request.review_reason,
          });
        }
      }
    }

    const enrichedRows = rows.map((row) => {
      const requestId = row.metadata?.withdrawal_request_id;
      const rejection =
        typeof requestId === "string" ? rejectionDetails.get(requestId) : undefined;

      if (!rejection) {
        return row;
      }

      return {
        ...row,
        metadata: {
          ...row.metadata,
          withdrawal_reviewed_at: rejection.reviewed_at,
          withdrawal_review_reason: rejection.review_reason,
        },
      };
    });

    const { items, totalPages } = buildSubscriptionHistoryResult({
      rows: enrichedRows,
      limit,
    });

    return {
      items,
      totalPages,
      error: null,
    };
  } catch (error) {
    console.error("[GET_SUBSCRIPTION_HISTORY_ERROR]", error);

    return {
      items: [],
      totalPages: 0,

      error: error instanceof Error ? error : new Error("Não foi possível carregar o histórico."),
    };
  }
}

export async function getSubscriptionData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const referenceAt = new Date();
  const referenceAtIso = referenceAt.toISOString();

  const [subscriptionResult, creditsResult, freeCreditResult] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),

    supabase.from("student_credits").select("*").eq("user_id", user.id).maybeSingle(),

    supabase
      .from("free_credit_allocations")
      .select(
        `
          remaining_amount,
          expires_at,
          status
        `
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (subscriptionResult.error) {
    console.error("[GET_SUBSCRIPTION_ERROR]", subscriptionResult.error);

    return null;
  }

  if (creditsResult.error) {
    console.error("[GET_STUDENT_CREDITS_ERROR]", creditsResult.error);

    return null;
  }

  if (freeCreditResult.error) {
    console.error("[GET_FREE_CREDIT_ALLOCATION_ERROR]", freeCreditResult.error);

    return null;
  }

  const subscription = subscriptionResult.data;

  const credits = creditsResult.data;

  const freeCreditAllocation = freeCreditResult.data;

  if (!subscription) {
    return {
      hasSubscription: false as const,
      subscription: null,
      credits: null,
    };
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
          name,
          external_id,
          credits_included,
          interval,
          interval_count,
          price
        `
    )
    .eq("id", subscription.plan_id)
    .eq("is_active", true)
    .maybeSingle();

  if (planError) {
    console.error("[GET_SUBSCRIPTION_PLAN_ERROR]", planError);

    return null;
  }

  if (!plan) {
    return {
      hasSubscription: false as const,
      subscription: null,
      credits: null,
    };
  }

  const [activeWithdrawalResult, initialPaymentResult, withdrawalCountResult] = await Promise.all([
    subscription.active_withdrawal_request_id
      ? supabase
          .from("subscription_withdrawal_requests")
          .select("processing_mode, status, eligibility_deadline_at")
          .eq("id", subscription.active_withdrawal_request_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    subscription.external_id
      ? supabase
          .from("student_payments")
          .select("paid_at")
          .eq("user_id", user.id)
          .eq("subscription_id", subscription.id)
          .eq("kind", "subscription")
          .in("status", ["paid", "active"])
          .not("paid_at", "is", null)
          .or(
            `external_id.eq.${subscription.external_id},metadata->>pagarme_subscription_id.eq.${subscription.external_id}`
          )
          .order("paid_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("subscription_withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
  ]);

  if (activeWithdrawalResult.error) {
    console.error("[GET_ACTIVE_WITHDRAWAL_ERROR]", activeWithdrawalResult.error);
  }

  if (initialPaymentResult.error) {
    console.error("[GET_WITHDRAWAL_INITIAL_PAYMENT_ERROR]", initialPaymentResult.error);
  }

  if (withdrawalCountResult.error) {
    console.error("[GET_WITHDRAWAL_COUNT_ERROR]", withdrawalCountResult.error);
  }

  const initialPaidAt = initialPaymentResult.data?.paid_at ?? subscription.current_period_start;
  const withdrawalDeadline = initialPaidAt
    ? new Date(new Date(initialPaidAt).getTime() + 168 * 60 * 60 * 1000).toISOString()
    : null;
  const withdrawalEligible =
    Boolean(withdrawalDeadline) &&
    new Date(withdrawalDeadline as string).getTime() >= referenceAt.getTime() &&
    subscription.status === "active" &&
    !subscription.active_withdrawal_request_id;
  const withdrawalProcessingMode =
    activeWithdrawalResult.data?.processing_mode ??
    (withdrawalEligible
      ? (withdrawalCountResult.count ?? 0) === 0
        ? "automatic"
        : "manual"
      : null);

  let pendingPlanName: string | null = null;

  if (subscription.pending_plan_id) {
    const { data: pendingPlan, error: pendingPlanError } = await supabase
      .from("plans")
      .select("name")
      .eq("id", subscription.pending_plan_id)
      .maybeSingle();

    if (pendingPlanError) {
      console.error("[GET_PENDING_SUBSCRIPTION_PLAN_ERROR]", pendingPlanError);

      return null;
    }

    pendingPlanName = pendingPlan?.name ?? null;
  }

  const freeCreditExpirationTime = freeCreditAllocation?.expires_at
    ? new Date(freeCreditAllocation.expires_at).getTime()
    : null;

  const hasValidFreeCredit =
    freeCreditAllocation?.status === "active" &&
    freeCreditAllocation.remaining_amount > 0 &&
    freeCreditExpirationTime !== null &&
    !Number.isNaN(freeCreditExpirationTime) &&
    freeCreditExpirationTime > referenceAt.getTime();

  let mentorshipCycle: {
    cycle_number: number;
    amount: number;
    remaining_amount: number;
    compensatory_refunds: number;
    expires_at: string;
  } | null = null;

  const { data: currentCycle, error: mentorshipCycleError } = await supabase
    .from("mentorship_credit_allocations")
    .select(
      `
      cycle_number,
      amount,
      remaining_amount,
      compensatory_refunds,
      expires_at
    `
    )
    .eq("user_id", user.id)
    .lte("available_at", referenceAtIso)
    .gt("expires_at", referenceAtIso)
    .in("status", ["scheduled", "active", "consumed"])
    .order("cycle_number", {
      ascending: true,
    })
    .maybeSingle();

  if (mentorshipCycleError) {
    console.error("[GET_MENTORSHIP_CYCLE_ERROR]", mentorshipCycleError);

    return null;
  }

  mentorshipCycle = currentCycle;

  return {
    hasSubscription: true as const,

    subscription: {
      ...subscription,

      plan_name: plan.name,
      plan_external_id: plan.external_id,

      interval: plan.interval,
      interval_count: plan.interval_count,

      price: plan.price,
      credits_included: plan.credits_included,

      mentorship_cycle_number: mentorshipCycle?.cycle_number ?? null,

      mentorship_cycle_remaining: mentorshipCycle
        ? mentorshipCycle.remaining_amount + mentorshipCycle.compensatory_refunds
        : null,

      mentorship_cycle_total: mentorshipCycle
        ? mentorshipCycle.amount + mentorshipCycle.compensatory_refunds
        : null,

      mentorship_cycle_end: mentorshipCycle?.expires_at ?? null,

      withdrawal_eligible: withdrawalEligible,
      withdrawal_processing_mode: withdrawalProcessingMode,
      withdrawal_eligibility_deadline_at:
        activeWithdrawalResult.data?.eligibility_deadline_at ?? withdrawalDeadline,

      pending_plan_name: pendingPlanName,
    },

    credits: credits
      ? {
          ...credits,

          free_credits: hasValidFreeCredit ? freeCreditAllocation.remaining_amount : 0,

          free_credit_expires_at: hasValidFreeCredit ? freeCreditAllocation.expires_at : null,

          renew_date: subscription.cancel_at_period_end
            ? subscription.current_period_end
            : subscription.next_billing_at,

          total_credits: plan.credits_included,
        }
      : null,

  };
}

export async function getCreditsHistory({
  filters,
  page = 1,
  limit = 10,
}: GetCreditsHistoryParams = {}): Promise<{
  transactions: CreditTransaction[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;

    let query = supabase
      .from("credit_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (filters?.type) {
      query = query.eq("type", filters.type);
    }

    if (filters?.from) {
      query = query.gte("created_at", filters.from);
    }

    if (filters?.to) {
      query = query.lte("created_at", filters.to);
    }

    const { data, count, error } = await query
      .range(rangeStart, rangeEnd)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      transactions: data,
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: null,
    };
  } catch (error) {
    console.error("Erro ao buscar histórico de créditos:", error);

    return {
      transactions: [],
      totalPages: 0,
      error: error as PostgrestError,
    };
  }
}
