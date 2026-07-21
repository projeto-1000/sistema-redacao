import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import { resolvePagarmeSubscriptionItem } from "@/services/plan-change/pagarme";

import type {
  CancelScheduledPlanChangeResult,
  PlanDowngradePreview,
  SchedulePlanDowngradeResult,
} from "@/services/plan-change/types";

import { updatePagarmeSubscriptionItem } from "@repo/payments";

import { revalidatePath } from "next/cache";

export async function getPlanDowngradePreviewService(
  targetPlanId: string
): Promise<PlanDowngradePreview | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const admin = createAdminClient();

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select(
      `
        id,
        external_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        pending_plan_id,
        pending_change_type,
        pending_change_at
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    subscriptionError ||
    !subscription ||
    subscription.status !== "active" ||
    subscription.cancel_at_period_end ||
    subscription.pending_plan_id ||
    subscription.pending_change_type ||
    subscription.pending_change_at ||
    !subscription.current_period_start ||
    !subscription.current_period_end
  ) {
    return null;
  }

  const { data: plans, error: plansError } = await admin
    .from("plans")
    .select(
      `
        id,
        name,
        price,
        credits_included,
        interval,
        interval_count
      `
    )
    .in("id", [subscription.plan_id, targetPlanId]);

  if (plansError || !plans || plans.length !== 2) {
    return null;
  }

  const currentPlan = plans.find((plan) => plan.id === subscription.plan_id);

  const targetPlan = plans.find((plan) => plan.id === targetPlanId);

  if (
    !currentPlan ||
    !targetPlan ||
    targetPlan.price >= currentPlan.price ||
    targetPlan.interval !== currentPlan.interval ||
    (targetPlan.interval_count ?? 1) !== (currentPlan.interval_count ?? 1)
  ) {
    return null;
  }

  return {
    subscriptionId: subscription.id,
    subscriptionExternalId: subscription.external_id,

    currentPeriodEnd: subscription.current_period_end,

    currentPlan: {
      id: currentPlan.id,
      name: currentPlan.name,
      price: currentPlan.price,
      creditsIncluded: currentPlan.credits_included,
    },

    newPlan: {
      id: targetPlan.id,
      name: targetPlan.name,
      price: targetPlan.price,
      creditsIncluded: targetPlan.credits_included,
    },
  };
}

export async function schedulePlanDowngradeService(
  targetPlanId: string
): Promise<SchedulePlanDowngradeResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "Você precisa estar autenticado.",
      };
    }

    const preview = await getPlanDowngradePreviewService(targetPlanId);

    if (!preview) {
      return {
        success: false,
        message: "Não foi possível validar o downgrade solicitado.",
      };
    }

    if (!preview.subscriptionExternalId) {
      return {
        success: false,
        message: "A assinatura não está vinculada ao Pagar.me.",
      };
    }

    const subscriptionItem = await resolvePagarmeSubscriptionItem({
      subscriptionExternalId: preview.subscriptionExternalId,
    });

    if (!subscriptionItem) {
      return {
        success: false,
        message: "Não foi possível identificar o item recorrente da assinatura.",
      };
    }

    await updatePagarmeSubscriptionItem({
      subscriptionId: preview.subscriptionExternalId,

      itemId: subscriptionItem.id,

      name: preview.newPlan.name,

      description: `Assinatura do plano ${preview.newPlan.name}`,

      price: preview.newPlan.price,

      quantity: 1,

      status: "active",
    });

    const admin = createAdminClient();

    const { data: updatedSubscription, error: updateError } = await admin
      .from("subscriptions")
      .update({
        pending_plan_id: preview.newPlan.id,

        pending_change_type: "downgrade",

        pending_change_at: preview.currentPeriodEnd,
      })
      .eq("id", preview.subscriptionId)
      .eq("user_id", user.id)
      .eq("plan_id", preview.currentPlan.id)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (updateError || !updatedSubscription) {
      console.error("[SCHEDULE_PLAN_DOWNGRADE_DATABASE_ERROR]", updateError);

      return {
        success: false,
        message: "O valor futuro foi atualizado, mas não foi possível registrar o downgrade.",
      };
    }

    revalidatePath("/assinatura");
    revalidatePath("/perfil");

    return {
      success: true,

      subscriptionId: preview.subscriptionId,

      previousPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      scheduledAt: preview.currentPeriodEnd,
    };
  } catch (error) {
    console.error("[SCHEDULE_PLAN_DOWNGRADE_ERROR]", error);

    return {
      success: false,
      message: "Não foi possível agendar o downgrade. Tente novamente.",
    };
  }
}

export async function cancelScheduledPlanChangeService(): Promise<CancelScheduledPlanChangeResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "Você precisa estar autenticado.",
      };
    }

    const admin = createAdminClient();

    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select(
        `
          id,
          external_id,
          plan_id,
          status,
          pending_plan_id,
          pending_change_type,
          pending_change_at
        `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError || !subscription) {
      console.error("[CANCEL_PLAN_CHANGE_SUBSCRIPTION_ERROR]", subscriptionError);

      return {
        success: false,
        message: "Não foi possível carregar sua assinatura.",
      };
    }

    if (
      subscription.status !== "active" ||
      !subscription.pending_plan_id ||
      subscription.pending_change_type !== "downgrade" ||
      !subscription.pending_change_at
    ) {
      return {
        success: false,
        message: "Não existe uma alteração de plano agendada.",
      };
    }

    if (new Date(subscription.pending_change_at).getTime() <= Date.now()) {
      return {
        success: false,
        message: "Essa alteração já atingiu a data de processamento e não pode mais ser cancelada.",
      };
    }

    if (!subscription.external_id) {
      return {
        success: false,
        message: "A assinatura não está vinculada ao Pagar.me.",
      };
    }

    const { data: currentPlan, error: currentPlanError } = await admin
      .from("plans")
      .select(
        `
          id,
          name,
          price
        `
      )
      .eq("id", subscription.plan_id)
      .maybeSingle();

    if (currentPlanError || !currentPlan) {
      console.error("[CANCEL_PLAN_CHANGE_CURRENT_PLAN_ERROR]", currentPlanError);

      return {
        success: false,
        message: "Não foi possível carregar o plano atual.",
      };
    }

    const subscriptionItem = await resolvePagarmeSubscriptionItem({
      subscriptionExternalId: subscription.external_id,
    });

    await updatePagarmeSubscriptionItem({
      subscriptionId: subscription.external_id,

      itemId: subscriptionItem.id,

      name: currentPlan.name,

      description: `Assinatura do plano ${currentPlan.name}`,

      price: currentPlan.price,

      quantity: 1,

      status: "active",
    });

    const { data: updatedSubscription, error: updateError } = await admin
      .from("subscriptions")
      .update({
        pending_plan_id: null,
        pending_change_type: null,
        pending_change_at: null,
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("pending_plan_id", subscription.pending_plan_id)
      .eq("pending_change_type", "downgrade")
      .eq("pending_change_at", subscription.pending_change_at)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedSubscription) {
      console.error("[CANCEL_PLAN_CHANGE_DATABASE_ERROR]", updateError);

      return {
        success: false,
        message:
          "O valor da assinatura foi restaurado, mas não foi possível remover o agendamento.",
      };
    }

    revalidatePath("/assinatura");
    revalidatePath("/assinatura/planos");
    revalidatePath("/perfil");

    return {
      success: true,
      subscriptionId: subscription.id,
      restoredPlanId: currentPlan.id,
    };
  } catch (error) {
    console.error("[CANCEL_SCHEDULED_PLAN_CHANGE_ERROR]", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Não foi possível cancelar a alteração de plano.",
    };
  }
}
