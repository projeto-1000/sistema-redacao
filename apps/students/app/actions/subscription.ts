import { createClient } from "@/lib/server";
import { CreditTransaction, CreditsFilters } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";

interface GetCreditsHistoryParams {
  filters?: CreditsFilters;
  page?: number;
  limit?: number;
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
    },

    credits: credits
      ? {
          ...credits,

          free_credits: hasValidFreeCredit ? freeCreditAllocation.remaining_amount : 0,

          free_credit_expires_at: hasValidFreeCredit ? freeCreditAllocation.expires_at : null,

          renew_date: subscription.current_period_end,

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
