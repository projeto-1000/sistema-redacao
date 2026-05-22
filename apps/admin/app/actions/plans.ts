"use server";

import { createClient } from "@/lib/server";
import { Plans } from "@repo/types";
import { CreatePlanFormValues, createPlanSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

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

export async function createPlan(data: CreatePlanFormValues) {
  try {
    const supabase = await createClient();

    const parsedData = createPlanSchema.parse(data);

    const { error } = await supabase.from("plans").insert([
      {
        name: parsedData.name,
        billing_cycle: parsedData.billing_cycle,
        price: parsedData.price,
        credits_included: parsedData.credits_included,
        is_active: parsedData.is_active,
        description: parsedData.description,
      },
    ]);

    if (error) {
      console.error("Erro ao inserir plano no Supabase:", error);
      return { success: false, error: "Erro ao cadastrar o plano no banco de dados." };
    }

    revalidatePath("/admin/planos");
    return { success: true, error: null };
  } catch (err) {
    console.error("Erro inesperado em createPlan:", err);
    return { success: false, error: "Erro interno no servidor." };
  }
}
