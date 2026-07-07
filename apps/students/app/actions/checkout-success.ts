"use server";

import { createClient } from "@/lib/server";
import type { CheckoutSuccessActionResult } from "@/types";

export async function getCheckoutSuccessData(
  subscriptionId: string
): Promise<CheckoutSuccessActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "unauthenticated",
    };
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        plan_id,
        status,
        payment_method,
        current_period_start,
        current_period_end
      `
    )
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    console.error("[CHECKOUT_SUCCESS_SUBSCRIPTION_ERROR]", subscriptionError);

    return {
      status: "not_found",
    };
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
        id,
        name,
        price,
        credits_included
      `
    )
    .eq("id", subscription.plan_id)
    .maybeSingle();

  if (planError) {
    console.error("[CHECKOUT_SUCCESS_PLAN_ERROR]", planError);
  }

  return {
    status: "success",
    data: {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        paymentMethod: subscription.payment_method,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      },
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            creditsIncluded: plan.credits_included,
          }
        : null,
    },
  };
}
