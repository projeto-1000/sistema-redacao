"use server";

import { createClient } from "@/lib/server";
import { PlanData } from "@/types";

export async function getAvailablePlans(currentPlanId: string | null): Promise<PlanData[]> {
  const supabase = await createClient();

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, name, price, interval, interval_count, features, is_public, external_id")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error || !plans) {
    console.error("Erro ao buscar planos:", error.message);
    return [];
  }

  const availablePlans = plans.filter((plan) => {
    if (plan.id === currentPlanId) return true;
    return plan.is_public && plan.price > 0 && plan.external_id !== "internal_mentoria_free";
  });

  return availablePlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    interval: plan.interval,
    interval_count: plan.interval_count,
    features: plan.features || [],
  }));
}

export async function getCurrentUserPlanId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", user.id)
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (error || !subscription) {
    return null;
  }

  return subscription.plan_id;
}
