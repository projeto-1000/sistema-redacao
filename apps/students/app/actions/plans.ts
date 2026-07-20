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

  status: SubscriptionStatus;

  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;

  cancelAtPeriodEnd: boolean;
}

function getPlanKind({
  externalId,
  price,
  isPublic,
}: {
  externalId: string | null;
  price: number;
  isPublic: boolean;
}): CurrentPlanKind {
  if (externalId === "internal_free_trial") {
    return "free_trial";
  }

  if (externalId === "internal_mentoria_free") {
    return "mentorship";
  }

  if (price > 0 && isPublic) {
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
        cancel_at_period_end
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

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
        id,
        name,
        external_id,
        price,
        is_public
      `
    )
    .eq("id", subscription.plan_id)
    .maybeSingle();

  if (planError) {
    console.error("[GET_CURRENT_SUBSCRIPTION_PLAN_ERROR]", planError);

    return null;
  }

  if (!plan) {
    return null;
  }

  return {
    subscriptionId: subscription.id,

    subscriptionExternalId: subscription.external_id,

    planId: plan.id,
    planName: plan.name,
    planExternalId: plan.external_id,

    planKind: getPlanKind({
      externalId: plan.external_id,
      price: plan.price,
      isPublic: plan.is_public,
    }),

    status: subscription.status as SubscriptionStatus,

    currentPeriodStart: subscription.current_period_start,

    currentPeriodEnd: subscription.current_period_end,

    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  };
}
