import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  PlanosContent,
  type PublicPlan,
} from "@/components/site/PlanosContent";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Comece com uma correção completa gratuita e escolha a oferta que acompanha seu ritmo, sem fidelidade.",
};

export const revalidate = 60;

async function getPublicPlans(): Promise<PublicPlan[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[PUBLIC_PLANS_CONFIG_ERROR] Supabase public configuration is missing.",
    );
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, name, description, price, interval, interval_count, discount_percentage, is_recommended",
    )
    .eq("is_active", true)
    .eq("is_public", true)
    .gt("price", 0)
    .order("price", { ascending: true });

  if (error) {
    console.error("[PUBLIC_PLANS_QUERY_ERROR]", error);
    return [];
  }

  return (data ?? []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.price,
    interval: plan.interval,
    intervalCount: plan.interval_count,
    discountPercentage: plan.discount_percentage,
    isRecommended: plan.is_recommended,
  }));
}

export default async function PlanosPage() {
  const plans = await getPublicPlans();

  return <PlanosContent plans={plans} />;
}
