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

  if (!user) return null;

  const [subscriptionData, creditsData] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
    supabase.from("student_credits").select("*").eq("user_id", user.id).single(),
  ]);

  const subscription = subscriptionData.data;
  const credits = creditsData.data;

  const { data: plan, error } = await supabase
    .from("plans")
    .select("name, credits_included, billing_cycle, price_in_cents")
    .eq("id", subscription.plan_id)
    .eq("is_active", true)
    .single();

  if (error) return null;

  return {
    subscription: {
      ...subscription,
      plan_name: plan.name,
      billing_cycle: plan.billing_cycle,
      price: plan.price_in_cents,
      credits_included: plan.credits_included,
    },
    credits: {
      ...credits,
      renew_date: subscription.current_period_end,
      total_credits: plan.credits_included,
    },
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
