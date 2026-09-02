"use server";

import { createClient } from "@/lib/server";
import type { StudentCreditSummary } from "@/types/credits";
import { CreditPackage } from "@repo/types";

export async function getCreditPackages(): Promise<CreditPackage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("extra_credit_packages")
    .select("id, name, description, credits_amount, price_cents")
    .eq("is_active", true)
    .order("credits_amount", { ascending: true })
    .order("price_cents", { ascending: true });

  if (error) {
    console.error("[EXTRA_CREDIT_PACKAGES_LIST_ERROR]", error);
    throw new Error("Não foi possível carregar os pacotes de créditos extras.");
  }

  return (data ?? []).map((packageItem) => ({
    id: packageItem.id,
    name: packageItem.name,
    description: packageItem.description ?? undefined,
    credits: packageItem.credits_amount,
    price: packageItem.price_cents / 100,
  }));
}

export async function getCurrentStudentCreditSummary(): Promise<StudentCreditSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_current_student_credit_summary");

  if (error) {
    console.error("Erro ao buscar resumo de créditos:", error);
    throw new Error("Não foi possível carregar os créditos disponíveis.");
  }

  return data as unknown as StudentCreditSummary;
}

export async function getUserCredits() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("student_credits")
    .select("extra_credits")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar créditos:", error);
    return 0;
  }

  return data?.extra_credits ?? 0;
}

export interface SavedPaymentCard {
  id: string;
  brand: string | null;
  lastFourDigits: string;
  holderName: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

export async function getSavedPaymentCards(): Promise<SavedPaymentCard[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("student_payment_cards")
    .select(
      `
        id,
        brand,
        last_four_digits,
        holder_name,
        exp_month,
        exp_year,
        is_default
      `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[EXTRA_CREDITS_SAVED_CARDS_ERROR]", error);
    throw new Error("Não foi possível carregar seus cartões.");
  }

  return (data ?? []).map((card) => ({
    id: card.id,
    brand: card.brand,
    lastFourDigits: card.last_four_digits,
    holderName: card.holder_name,
    expMonth: card.exp_month,
    expYear: card.exp_year,
    isDefault: card.is_default,
  }));
}
