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

    const priceInCents = Math.round(parsedData.price * 100);

    if (priceInCents === 0) {
      const { error } = await supabase.from("plans").insert([
        {
          name: parsedData.name,
          external_id: "internal_mentoria_free",
          interval: "month",
          interval_count: 3,
          price: 0,
          credits_included: 5,
          credits_expiration_days: 30,
          is_active: parsedData.is_active,
          description: parsedData.description,
        },
      ]);

      if (error) {
        console.error("Erro ao inserir plano gratuito no Supabase:", error);
        return { success: false, error: "Falha ao salvar o plano gratuito no banco." };
      }

      revalidatePath("/planos");
      return { success: true, error: null };
    }

    const pagarmePayload = {
      name: parsedData.name,
      description: parsedData.description || "Plano de assinaturas",
      payment_methods: ["credit_card", "debit_card", "boleto"],
      installments: [1],
      minimum_price: priceInCents,
      currency: "BRL",
      interval: parsedData.interval,
      interval_count: parsedData.interval_count,
      billing_type: "prepaid",
      items: [
        {
          name: `${parsedData.name} - Pacote de ${parsedData.credits_included} Redações`,
          quantity: 1,
          pricing_scheme: {
            scheme_type: "unit",
            price: priceInCents,
          },
        },
      ],
      metadata: {
        credits_included: parsedData.credits_included.toString(),
        credits_expiration_days: parsedData.credits_expiration_days.toString(),
      },
    };

    const pagarmeResponse = await fetch("https://api.pagar.me/core/v5/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString("base64")}`,
      },
      body: JSON.stringify(pagarmePayload),
    });

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.json();
      console.error("❌ Erro Pagar.me:", errorData);
      return {
        success: false,
        error: "Falha ao criar plano no gateway de pagamento. Verifique os logs.",
      };
    }

    const pagarmePlan = await pagarmeResponse.json();

    const { error } = await supabase.from("plans").insert([
      {
        name: parsedData.name,
        external_id: pagarmePlan.id,
        interval: parsedData.interval,
        interval_count: parsedData.interval_count,
        price: priceInCents,
        credits_included: parsedData.credits_included,
        credits_expiration_days: parsedData.credits_expiration_days,
        is_active: parsedData.is_active,
        description: parsedData.description,
      },
    ]);

    if (error) {
      console.error("Erro ao inserir plano no Supabase:", error);

      await fetch(`https://api.pagar.me/core/v5/plans/${pagarmePlan.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString("base64")}`,
        },
      }).catch((err) => console.error("Falha ao excluir plano órfão na Pagar.me:", err));

      return {
        success: false,
        error:
          "Falha ao salvar no banco local. O plano gerado na Pagar.me foi excluído por segurança.",
      };
    }

    revalidatePath("/planos");
    return { success: true, error: null };
  } catch (err) {
    console.error("Erro inesperado em createPlan:", err);
    return { success: false, error: "Erro interno no servidor." };
  }
}

export async function updatePlan(id: string, data: CreatePlanFormValues) {
  try {
    const supabase = await createClient();
    const parsedData = createPlanSchema.parse(data);

    const { data: currentPlan, error: fetchError } = await supabase
      .from("plans")
      .select("external_id")
      .eq("id", id)
      .single();

    if (fetchError || !currentPlan) {
      return { success: false, error: "Plano não encontrado no banco de dados." };
    }

    const priceInCents = Math.round(parsedData.price * 100);

    if (priceInCents === 0 || currentPlan.external_id === "internal_mentoria_free") {
      const { error: dbError } = await supabase
        .from("plans")
        .update({
          name: parsedData.name,
          interval: parsedData.interval,
          interval_count: parsedData.interval_count,
          price: parsedData.price,
          credits_included: parsedData.credits_included,
          credits_expiration_days: parsedData.credits_expiration_days,
          is_active: parsedData.is_active,
          description: parsedData.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (dbError) {
        console.error("Erro ao atualizar plano interno no Supabase:", dbError);
        return { success: false, error: "Erro ao atualizar o plano." };
      }

      revalidatePath("/planos");
      return { success: true, error: null };
    }

    const pagarmePayload = {
      name: parsedData.name,
      status: parsedData.is_active ? "active" : "inactive",
      description: parsedData.description || "Plano de assinaturas",
      currency: "BRL",
      interval: parsedData.interval,
      interval_count: parsedData.interval_count,
      minimum_price: priceInCents,
      payment_methods: ["credit_card", "debit_card", "boleto"],
    };

    const pagarmeResponse = await fetch(
      `https://api.pagar.me/core/v5/plans/${currentPlan.external_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString("base64")}`,
        },
        body: JSON.stringify(pagarmePayload),
      }
    );

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.json();
      console.error("❌ Erro ao editar na Pagar.me:", errorData);
      return {
        success: false,
        error: "Falha ao atualizar o plano no gateway de pagamento.",
      };
    }

    const { error: dbUpdateError } = await supabase
      .from("plans")
      .update({
        name: parsedData.name,
        interval: parsedData.interval,
        interval_count: parsedData.interval_count,
        price: priceInCents,
        credits_included: parsedData.credits_included,
        credits_expiration_days: parsedData.credits_expiration_days,
        is_active: parsedData.is_active,
        description: parsedData.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (dbUpdateError) {
      console.error("Erro ao atualizar plano no Supabase:", dbUpdateError);
      return { success: false, error: "Gateway atualizado, mas falhou ao salvar no banco local." };
    }

    revalidatePath("/planos");
    return { success: true, error: null };
  } catch (err) {
    console.error("Erro inesperado em updatePlan:", err);
    return { success: false, error: "Erro interno no servidor." };
  }
}

export async function updatePlanStatus(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const newStatus = !currentStatus;

    const { data: plan, error: fetchError } = await supabase
      .from("plans")
      .select("external_id, name, interval, interval_count, price")
      .eq("id", id)
      .single();

    if (fetchError || !plan) {
      return { success: false, error: "Plano não encontrado no banco de dados." };
    }

    if (plan.external_id && plan.external_id !== "internal_mentoria_free") {
      const pagarmePayload = {
        name: plan.name,
        status: newStatus ? "active" : "inactive",
        currency: "BRL",
        interval: plan.interval,
        interval_count: plan.interval_count,
        minimum_price: plan.price,
        payment_methods: ["credit_card", "debit_card", "boleto"],
      };

      const pagarmeResponse = await fetch(
        `https://api.pagar.me/core/v5/plans/${plan.external_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString("base64")}`,
          },
          body: JSON.stringify(pagarmePayload),
        }
      );

      if (!pagarmeResponse.ok) {
        const errorData = await pagarmeResponse.json();
        console.error("❌ Erro ao alterar status na Pagar.me:", errorData);
        return {
          success: false,
          error: "Falha ao sincronizar o novo status com o gateway de pagamento.",
        };
      }
    }

    const { error: dbError } = await supabase
      .from("plans")
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (dbError) {
      console.error("Erro em updatePlanStatus no Supabase:", dbError);
      return { success: false, error: "Gateway atualizado, mas falhou ao alterar localmente." };
    }

    revalidatePath("/planos");
    return { success: true, error: null };
  } catch (err) {
    console.error("Erro inesperado em updatePlanStatus:", err);
    return { success: false, error: "Erro interno no servidor." };
  }
}
