"use server";

import {
  createPagarmePlan,
  getPagarmePlan,
  PagarmePlanApiError,
  type PagarmePlan,
  type PagarmePlanItem,
  type PagarmePlanPayload,
  updatePagarmePlan,
  updatePagarmePlanItem,
} from "@/lib/pagarme-plans";
import { createClient } from "@/lib/server";
import type { Plans } from "@repo/types";
import { type CreatePlanFormValues, createPlanSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

const INTERNAL_MENTORSHIP_PLAN_ID = "internal_mentoria_free";
const DEFAULT_PAYMENT_METHODS = ["credit_card", "debit_card", "boleto"];

class PlanAuthorizationError extends Error {}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new PlanAuthorizationError("Sessão administrativa inválida.");
  }

  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") {
    throw new PlanAuthorizationError("Você não tem permissão para gerenciar planos.");
  }
}

function getPlanItemName(name: string, creditsIncluded: number) {
  return `${name} - Pacote de ${creditsIncluded} Redações`.slice(0, 64);
}

function getPlanItemDescription(description?: string | null) {
  return (description || "Plano de assinaturas").slice(0, 256);
}

function withoutLegacyProductCode(metadata?: Record<string, string>) {
  const remainingMetadata = { ...metadata };
  delete remainingMetadata.product_code;

  return remainingMetadata;
}

function getActivePlanItem(plan: PagarmePlan) {
  const activeItems = plan.items.filter((item) => item.status === "active" && !item.deleted_at);

  if (activeItems.length !== 1) {
    throw new Error(
      "O plano da Pagar.me precisa ter exatamente um item ativo para ser editado com segurança."
    );
  }

  return activeItems[0]!;
}

function getRemotePlanPayload(plan: PagarmePlan, fallbackPrice: number): PagarmePlanPayload {
  if (plan.status === "deleted") {
    throw new Error("Um plano excluído na Pagar.me não pode ser sincronizado.");
  }

  return {
    name: plan.name,
    description: plan.description,
    status: plan.status,
    payment_methods: plan.payment_methods ?? DEFAULT_PAYMENT_METHODS,
    installments: plan.installments ?? [1],
    minimum_price: plan.minimum_price ?? fallbackPrice,
    currency: plan.currency || "BRL",
    interval: plan.interval,
    interval_count: plan.interval_count,
    billing_type: plan.billing_type ?? "prepaid",
    metadata: plan.metadata,
  };
}

function getRemoteItemPayload(item: PagarmePlanItem) {
  const price = item.pricing_scheme.price;

  if (item.pricing_scheme.scheme_type !== "unit" || !price || price <= 0) {
    throw new Error("O item da Pagar.me não usa uma precificação unitária válida.");
  }

  return {
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    cycles: item.cycles,
    status: item.status === "active" ? ("active" as const) : ("inactive" as const),
    pricing_scheme: {
      scheme_type: "unit" as const,
      price,
    },
  };
}

interface PagarmeChanges {
  plan: boolean;
  item: boolean;
}

async function restorePagarmePlan(
  plan: PagarmePlan,
  item: PagarmePlanItem,
  fallbackPrice: number,
  changes: PagarmeChanges
) {
  const restorations: Array<Promise<unknown>> = [];

  if (changes.plan) {
    restorations.push(updatePagarmePlan(plan.id, getRemotePlanPayload(plan, fallbackPrice)));
  }

  if (changes.item) {
    restorations.push(updatePagarmePlanItem(plan.id, item.id, getRemoteItemPayload(item)));
  }

  const results = await Promise.allSettled(restorations);

  const failures = results.filter((result) => result.status === "rejected");

  if (failures.length > 0) {
    console.error("[PLAN_PAGARME_ROLLBACK_ERROR]", failures);
    return false;
  }

  return true;
}

async function restorePagarmePlanStatus(plan: PagarmePlan, fallbackPrice: number) {
  try {
    await updatePagarmePlan(plan.id, getRemotePlanPayload(plan, fallbackPrice));
    return true;
  } catch (error) {
    console.error("[PLAN_STATUS_PAGARME_ROLLBACK_ERROR]", error);
    return false;
  }
}

function getUnexpectedError(error: unknown, operation: string) {
  console.error(`[PLAN_${operation}_ERROR]`, error);

  if (error instanceof PlanAuthorizationError) {
    return error.message;
  }

  if (error instanceof PagarmePlanApiError) {
    return "Falha ao sincronizar o plano com a Pagar.me. Nenhuma alteração local foi salva.";
  }

  if (error instanceof Error && error.message.includes("exatamente um item ativo")) {
    return error.message;
  }

  return "Erro interno no servidor.";
}

export async function getPlans(): Promise<{ plans: Plans[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { data: plans, error } = await supabase
      .from("plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      console.error("[PLAN_LIST_DB_ERROR]", error);
      return { plans: null, error: "Não foi possível carregar a lista de planos." };
    }

    return { plans, error: null };
  } catch (error) {
    return { plans: null, error: getUnexpectedError(error, "LIST") };
  }
}

export async function createPlan(data: CreatePlanFormValues) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const parsedData = createPlanSchema.parse(data);
    const priceInCents = Math.round(parsedData.price * 100);
    const subtitle = parsedData.subtitle || null;
    const description = parsedData.description || null;

    if (priceInCents === 0) {
      const { error } = await supabase.from("plans").insert({
        name: parsedData.name,
        external_id: INTERNAL_MENTORSHIP_PLAN_ID,
        interval: parsedData.interval,
        interval_count: parsedData.interval_count,
        price: 0,
        credits_included: parsedData.credits_included,
        credits_expiration_days: parsedData.credits_expiration_days,
        is_active: parsedData.is_active,
        is_public: parsedData.is_public,
        is_recommended: parsedData.is_recommended,
        discount_percentage: parsedData.discount_percentage,
        subtitle,
        description,
      });

      if (error) {
        console.error("[PLAN_CREATE_INTERNAL_DB_ERROR]", error);
        return { success: false, error: "Falha ao salvar o plano gratuito no banco." };
      }

      revalidatePath("/planos");
      return { success: true, error: null };
    }

    const pagarmePayload = {
      name: parsedData.name,
      description: description || "Plano de assinaturas",
      status: parsedData.is_active ? ("active" as const) : ("inactive" as const),
      payment_methods: DEFAULT_PAYMENT_METHODS,
      installments: [1],
      minimum_price: priceInCents,
      currency: "BRL",
      interval: parsedData.interval,
      interval_count: parsedData.interval_count,
      billing_type: "prepaid",
      items: [
        {
          name: getPlanItemName(parsedData.name, parsedData.credits_included),
          description: getPlanItemDescription(description),
          quantity: 1,
          pricing_scheme: {
            scheme_type: "unit" as const,
            price: priceInCents,
          },
        },
      ],
      metadata: {
        credits_included: parsedData.credits_included.toString(),
        credits_expiration_days: parsedData.credits_expiration_days.toString(),
        credit_release_interval: "month",
        credit_release_interval_count: "1",
      },
    };

    const pagarmePlan = await createPagarmePlan(pagarmePayload);

    if (!pagarmePlan.id?.startsWith("plan_")) {
      throw new Error("A Pagar.me não retornou um ID de plano válido.");
    }

    const { error } = await supabase.from("plans").insert({
      name: parsedData.name,
      external_id: pagarmePlan.id,
      interval: parsedData.interval,
      interval_count: parsedData.interval_count,
      price: priceInCents,
      credits_included: parsedData.credits_included,
      credits_expiration_days: parsedData.credits_expiration_days,
      is_active: parsedData.is_active,
      is_public: parsedData.is_public,
      is_recommended: parsedData.is_recommended,
      discount_percentage: parsedData.discount_percentage,
      subtitle,
      description,
    });

    if (error) {
      console.error("[PLAN_CREATE_DB_ERROR]", error);

      const deactivated = await deactivateOrphanPagarmePlan(pagarmePlan, priceInCents);

      return {
        success: false,
        error: deactivated
          ? "Falha ao salvar no banco. O plano criado na Pagar.me foi desativado."
          : "Falha ao salvar no banco e ao desativar o plano criado na Pagar.me. É necessária reconciliação manual.",
      };
    }

    revalidatePath("/planos");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getUnexpectedError(error, "CREATE") };
  }
}

async function deactivateOrphanPagarmePlan(plan: PagarmePlan, fallbackPrice: number) {
  try {
    await updatePagarmePlan(plan.id, {
      ...getRemotePlanPayload(plan, fallbackPrice),
      status: "inactive",
    });
    return true;
  } catch (error) {
    console.error("[PLAN_CREATE_COMPENSATION_ERROR]", error);
    return false;
  }
}

export async function updatePlan(id: string, data: CreatePlanFormValues) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const parsedData = createPlanSchema.parse(data);
    const priceInCents = Math.round(parsedData.price * 100);
    const subtitle = parsedData.subtitle || null;
    const description = parsedData.description || null;
    const { data: currentPlan, error: fetchError } = await supabase
      .from("plans")
      .select(
        "external_id, name, description, interval, interval_count, price, credits_included, credits_expiration_days, is_active"
      )
      .eq("id", id)
      .single();

    if (fetchError || !currentPlan) {
      return { success: false, error: "Plano não encontrado no banco de dados." };
    }

    const isPagarmePlan = currentPlan.external_id?.startsWith("plan_") ?? false;

    if (!isPagarmePlan) {
      if (priceInCents > 0) {
        return {
          success: false,
          error: "Um plano interno gratuito não pode ser convertido em plano pago.",
        };
      }

      const { error: dbError } = await supabase
        .from("plans")
        .update({
          name: parsedData.name,
          interval: parsedData.interval,
          interval_count: parsedData.interval_count,
          price: priceInCents,
          credits_included: parsedData.credits_included,
          credits_expiration_days: parsedData.credits_expiration_days,
          is_public: parsedData.is_public,
          is_recommended: parsedData.is_recommended,
          discount_percentage: parsedData.discount_percentage,
          subtitle,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (dbError) {
        console.error("[PLAN_UPDATE_INTERNAL_DB_ERROR]", dbError);
        return { success: false, error: "Erro ao atualizar o plano." };
      }

      revalidatePath("/planos");
      return { success: true, error: null };
    }

    if (priceInCents === 0) {
      return {
        success: false,
        error: "Um plano da Pagar.me não pode ser convertido em plano gratuito.",
      };
    }

    const hasPagarmeRelevantChanges =
      currentPlan.name !== parsedData.name ||
      currentPlan.price !== priceInCents ||
      currentPlan.interval !== parsedData.interval ||
      (currentPlan.interval_count ?? 1) !== parsedData.interval_count ||
      currentPlan.credits_included !== parsedData.credits_included ||
      currentPlan.credits_expiration_days !== parsedData.credits_expiration_days ||
      currentPlan.is_active !== parsedData.is_active;

    let pagarmeSync:
      | {
          plan: PagarmePlan;
          item: PagarmePlanItem;
          oldItemPrice: number;
          changes: PagarmeChanges;
        }
      | undefined;

    if (hasPagarmeRelevantChanges) {
      const pagarmePlan = await getPagarmePlan(currentPlan.external_id);
      const pagarmeItem = getActivePlanItem(pagarmePlan);
      const oldItemPrice = pagarmeItem.pricing_scheme.price ?? currentPlan.price;
      const desiredItemName = getPlanItemName(parsedData.name, parsedData.credits_included);
      const desiredPlanStatus = parsedData.is_active ? "active" : "inactive";
      const desiredMetadata = {
        ...withoutLegacyProductCode(pagarmePlan.metadata),
        credits_included: parsedData.credits_included.toString(),
        credits_expiration_days: parsedData.credits_expiration_days.toString(),
        credit_release_interval: "month",
        credit_release_interval_count: "1",
      };
      const shouldUpdateItem =
        pagarmeItem.name !== desiredItemName || oldItemPrice !== priceInCents;
      const shouldUpdatePlan =
        pagarmePlan.name !== parsedData.name ||
        pagarmePlan.status !== desiredPlanStatus ||
        (pagarmePlan.minimum_price ?? oldItemPrice) !== priceInCents ||
        pagarmePlan.interval !== parsedData.interval ||
        pagarmePlan.interval_count !== parsedData.interval_count ||
        pagarmePlan.metadata?.credits_included !== desiredMetadata.credits_included ||
        pagarmePlan.metadata?.credits_expiration_days !== desiredMetadata.credits_expiration_days ||
        pagarmePlan.metadata?.credit_release_interval !== desiredMetadata.credit_release_interval ||
        pagarmePlan.metadata?.credit_release_interval_count !==
          desiredMetadata.credit_release_interval_count;
      const changes: PagarmeChanges = { plan: false, item: false };

      try {
        if (shouldUpdateItem) {
          await updatePagarmePlanItem(pagarmePlan.id, pagarmeItem.id, {
            name: desiredItemName,
            description: pagarmeItem.description,
            quantity: pagarmeItem.quantity || 1,
            cycles: pagarmeItem.cycles,
            status: "active",
            pricing_scheme: {
              scheme_type: "unit",
              price: priceInCents,
            },
          });
          changes.item = true;
        }

        if (shouldUpdatePlan) {
          await updatePagarmePlan(pagarmePlan.id, {
            ...getRemotePlanPayload(pagarmePlan, oldItemPrice),
            name: parsedData.name,
            description: pagarmePlan.description,
            status: desiredPlanStatus,
            minimum_price: priceInCents,
            interval: parsedData.interval,
            interval_count: parsedData.interval_count,
            metadata: desiredMetadata,
          });
          changes.plan = true;
        }
      } catch (error) {
        console.error("[PLAN_UPDATE_PAGARME_ERROR]", error);
        const restored = await restorePagarmePlan(pagarmePlan, pagarmeItem, oldItemPrice, changes);

        return {
          success: false,
          error: restored
            ? "A Pagar.me recusou a edição; nenhuma alteração foi salva."
            : "A edição falhou e não foi possível confirmar a restauração na Pagar.me. É necessária reconciliação manual.",
        };
      }

      pagarmeSync = {
        plan: pagarmePlan,
        item: pagarmeItem,
        oldItemPrice,
        changes,
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
        is_public: parsedData.is_public,
        is_recommended: parsedData.is_recommended,
        discount_percentage: parsedData.discount_percentage,
        subtitle,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (dbUpdateError) {
      console.error("[PLAN_UPDATE_DB_ERROR]", dbUpdateError);

      if (!pagarmeSync || (!pagarmeSync.changes.plan && !pagarmeSync.changes.item)) {
        return { success: false, error: "Falha ao salvar as alterações no banco." };
      }

      const restored = await restorePagarmePlan(
        pagarmeSync.plan,
        pagarmeSync.item,
        pagarmeSync.oldItemPrice,
        pagarmeSync.changes
      );

      return {
        success: false,
        error: restored
          ? "Falha ao salvar no banco; as alterações da Pagar.me foram revertidas."
          : "Falha ao salvar no banco e ao restaurar a Pagar.me. É necessária reconciliação manual.",
      };
    }

    revalidatePath("/planos");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getUnexpectedError(error, "UPDATE") };
  }
}

export async function setPlanStatus(id: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { data: plan, error: fetchError } = await supabase
      .from("plans")
      .select("external_id, price, is_active")
      .eq("id", id)
      .single();

    if (fetchError || !plan) {
      return { success: false, error: "Plano não encontrado no banco de dados." };
    }

    if (plan.is_active === isActive) {
      return { success: true, error: null };
    }

    const isPagarmePlan = plan.external_id?.startsWith("plan_") ?? false;
    let pagarmePlan: PagarmePlan | null = null;

    if (plan.price > 0 && !isPagarmePlan) {
      return {
        success: false,
        error: "Plano pago sem vínculo válido com a Pagar.me. O status não foi alterado.",
      };
    }

    if (isPagarmePlan && plan.external_id) {
      pagarmePlan = await getPagarmePlan(plan.external_id);
      const fallbackPrice = pagarmePlan.minimum_price ?? plan.price;

      await updatePagarmePlan(pagarmePlan.id, {
        ...getRemotePlanPayload(pagarmePlan, fallbackPrice),
        status: isActive ? "active" : "inactive",
      });
    }

    const { error: dbError } = await supabase
      .from("plans")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (dbError) {
      console.error("[PLAN_STATUS_DB_ERROR]", dbError);

      if (pagarmePlan) {
        const restored = await restorePagarmePlanStatus(pagarmePlan, plan.price);

        return {
          success: false,
          error: restored
            ? "Falha ao alterar o status no banco; a Pagar.me foi restaurada."
            : "Falha ao alterar o status no banco e ao restaurar a Pagar.me. É necessária reconciliação manual.",
        };
      }

      return { success: false, error: "Falha ao alterar o status do plano." };
    }

    revalidatePath("/planos");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getUnexpectedError(error, "STATUS") };
  }
}
