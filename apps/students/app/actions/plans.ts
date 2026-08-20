"use server";

import { createClient } from "@/lib/server";
import { PlanData } from "@/types";
import type { SubscriptionStatus } from "@repo/types";

type CurrentPlanKind = "free_trial" | "mentorship" | "paid" | "other";

export interface CurrentUserSubscriptionContext {
  subscriptionId: string;
  subscriptionExternalId: string | null;

  planId: string;
  planName: string;
  planExternalId: string | null;
  planKind: CurrentPlanKind;

  planPrice: number;
  planCreditsIncluded: number;
  planInterval: string;
  planIntervalCount: number;

  status: SubscriptionStatus;

  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;

  cancelAtPeriodEnd: boolean;

  pendingPlanId: string | null;
  pendingChangeType: "downgrade" | null;
  pendingChangeAt: string | null;
}

function getPlanKind({
  externalId,
  price,
}: {
  externalId: string | null;
  price: number;
}): CurrentPlanKind {
  if (externalId === "internal_free_trial") {
    return "free_trial";
  }

  if (externalId === "internal_mentoria_free") {
    return "mentorship";
  }

  /*
   * is_public controla apenas a visibilidade do plano
   * no catálogo, não o tipo da assinatura.
   */
  if (price > 0) {
    return "paid";
  }

  return "other";
}

export async function getAvailablePlans(): Promise<PlanData[]> {
  const supabase = await createClient();

  const { data: plans, error } = await supabase
    .from("plans")
    .select(
      `
        id,
        name,
        price,
        credits_included,
        interval,
        interval_count,
        features
      `
    )
    .eq("is_active", true)
    .eq("is_public", true)
    .gt("price", 0)
    .order("price", {
      ascending: true,
    });

  if (error || !plans) {
    console.error("[GET_AVAILABLE_PLANS_ERROR]", error);

    return [];
  }

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    credits_included: plan.credits_included,
    interval: plan.interval,
    interval_count: plan.interval_count,
    features: plan.features ?? [],
  }));
}

export async function getCurrentUserSubscriptionContext(): Promise<CurrentUserSubscriptionContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[GET_CURRENT_USER_ERROR]", userError);

    return null;
  }

  if (!user) {
    return null;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        external_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        pending_plan_id,
        pending_change_type,
        pending_change_at
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error("[GET_CURRENT_SUBSCRIPTION_ERROR]", subscriptionError);

    return null;
  }

  if (!subscription) {
    return null;
  }

  const [planResult, contractResult] = await Promise.all([
    supabase
      .from("plans")
      .select(
        `
        id,
        name,
        external_id,
        price,
        credits_included,
        interval,
        interval_count,
        is_public
      `
      )
      .eq("id", subscription.plan_id)
      .maybeSingle(),
    supabase
      .from("subscription_contracts")
      .select("plan_name, price_cents, credits_included, interval, interval_count")
      .eq("subscription_id", subscription.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const { data: plan, error: planError } = planResult;

  if (planError) {
    console.error("[GET_CURRENT_SUBSCRIPTION_PLAN_ERROR]", planError);

    return null;
  }

  if (!plan) {
    return null;
  }

  if (contractResult.error) {
    console.error("[GET_CURRENT_SUBSCRIPTION_CONTRACT_ERROR]", contractResult.error);
  }

  const activeContract = contractResult.data;

  return {
    subscriptionId: subscription.id,

    subscriptionExternalId: subscription.external_id,

    planId: plan.id,
    planName: activeContract?.plan_name ?? plan.name,
    planExternalId: plan.external_id,

    planKind: getPlanKind({
      externalId: plan.external_id,
      price: activeContract?.price_cents ?? plan.price,
    }),

    planPrice: activeContract?.price_cents ?? plan.price,
    planCreditsIncluded: activeContract?.credits_included ?? plan.credits_included,
    planInterval: activeContract?.interval ?? plan.interval,
    planIntervalCount: activeContract?.interval_count ?? plan.interval_count ?? 1,

    status: subscription.status as SubscriptionStatus,

    currentPeriodStart: subscription.current_period_start,

    currentPeriodEnd: subscription.current_period_end,

    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    pendingPlanId: subscription.pending_plan_id,

    pendingChangeType: subscription.pending_change_type as "downgrade" | null,

    pendingChangeAt: subscription.pending_change_at,
  };
}
