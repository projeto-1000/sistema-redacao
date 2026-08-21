"use server";

import { createClient } from "@/lib/server";
import type { StudentCreditSummary } from "@/types/credits";
import { CreditPackage } from "@repo/types";
import { redirect } from "next/navigation";

// 1. Tipagem unificada que o front-end e o banco vão respeitar

// ============================================================================
// MOCKS: Quando for integrar, basta apagar este bloco e plugar o banco real
// ============================================================================
const MOCK_PACKAGES: CreditPackage[] = [
  { id: "pkg_1", name: "1 Crédito Avulso", credits: 1, price: 15 },
  { id: "pkg_5", name: "5 Créditos Avulsos", credits: 5, price: 65, popular: true },
  { id: "pkg_10", name: "10 Créditos Avulsos", credits: 10, price: 110 },
];

/**
 * Função para buscar os pacotes disponíveis.
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  // FUTURO: const { data } = await supabase.from('packages').select('*');
  return MOCK_PACKAGES;
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

/**
 * Server Action que processa a intenção de compra.
 */
export async function purchaseCreditsAction(packageId: string) {
  // FUTURO: Criar sessão no Stripe e redirecionar para a URL de checkout
  const selectedPackage = MOCK_PACKAGES.find((p) => p.id === packageId);

  if (!selectedPackage) throw new Error("Pacote inválido");

  // Simulando o redirecionamento de sucesso do Stripe passando o nome do produto
  redirect(`/comprar-creditos/confirmacao?product=${encodeURIComponent(selectedPackage.name)}`);
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
