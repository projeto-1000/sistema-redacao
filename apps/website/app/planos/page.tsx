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
<<<<<<< ours
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
=======
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
>>>>>>> theirs
    console.error(
      "[PUBLIC_PLANS_CONFIG_ERROR] Supabase public configuration is missing.",
    );
    return [];
  }

<<<<<<< ours
  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
=======
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
>>>>>>> theirs
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("plans")
    .select(
<<<<<<< ours
      "id, name, subtitle, description, price, credits_included, interval, interval_count, discount_percentage, is_recommended",
=======
      "id, name, subtitle, description, price, interval, interval_count, discount_percentage, is_recommended",
>>>>>>> theirs
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
    subtitle: plan.subtitle,
    description: plan.description,
    priceCents: plan.price,
<<<<<<< ours
    creditsIncluded: plan.credits_included,
=======
>>>>>>> theirs
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
