"use server";

import { createClient } from "@/lib/server";
import { Plans } from "@repo/types";

export async function getPlans(): Promise<{ plans: Plans[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: plans, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar planos:", error);
      return { plans: null, error: "Não foi possível carregar a lista de planos." };
    }

    return { plans, error: null };
  } catch (err) {
    console.error("Erro inesperado em getPlans:", err);
    return { plans: null, error: "Erro interno no servidor." };
  }
}
