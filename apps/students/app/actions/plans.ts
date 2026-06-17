"use server";

import { createClient } from "@/lib/server";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanData {
  id: string;
  name: string;
  badge?: string;
  price: number;
  interval: string;
  interval_count: number | null;
  features: PlanFeature[] | string[];
}

export async function getAvailablePlans(currentPlanId: string | null): Promise<PlanData[]> {
  const supabase = await createClient();

  let query = supabase
    .from("plans")
    .select("id, name, price, interval, interval_count, features")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (currentPlanId) {
    query = query.or(`is_public.eq.true,id.eq.${currentPlanId}`);
  } else {
    query = query.eq("is_public", true);
  }

  const { data: plans, error } = await query;

  if (error || !plans) {
    console.error("Erro ao buscar planos:", error.message);
    return [];
  }

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    badge: plan.name.toLowerCase().includes("premium") ? "RECOMENDADO" : undefined,
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
