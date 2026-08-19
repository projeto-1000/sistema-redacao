import { createAdminClient } from "@/lib/admin";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
} from "@/lib/integrations/datacrazy/sync-student";
import { createClient } from "@/lib/server";

import {
  resolvePagarmeSubscriptionItem,
  resolvePlanUpgradePaymentContext,
} from "@/services/plan-change/pagarme";

import {
  createOrRecoverPlanUpgradeOrder,
  finalizePlanUpgradeInDatabase,
  reservePlanUpgradePayment,
  updatePlanUpgradePaymentResult,
} from "@/services/plan-change/upgrade-payment";

import type { ExecutePlanUpgradeResult, PlanUpgradePreview } from "@/services/plan-change/types";

import { calculatePlanUpgrade } from "@/utils/calculate-plan-upgrade";

import { getPagarmeOrderPaymentResult, updatePagarmeSubscriptionItem } from "@repo/payments";

import { revalidatePath } from "next/cache";

export async function getPlanUpgradePreviewService(
  targetPlanId: string
): Promise<PlanUpgradePreview> {
  if (!targetPlanId) {
    throw new Error("O plano de destino é obrigatório.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Você precisa estar logado para alterar o plano.");
  }

  const { data: subscription, error: subscriptionError } = await supabase
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

  if (subscriptionError || !subscription) {
    throw new Error("Não foi possível encontrar sua assinatura atual.");
  }

  if (subscription.status !== "active" && subscription.status !== "trial") {
    throw new Error("Sua assinatura atual não permite alteração de plano.");
  }

  if (subscription.cancel_at_period_end) {
    throw new Error("Cancele o encerramento agendado antes de alterar o plano.");
  }

  if (
    subscription.pending_plan_id ||
    subscription.pending_change_type ||
    subscription.pending_change_at
  ) {
    throw new Error("Já existe uma alteração de plano agendada.");
  }

  if (!subscription.current_period_start || !subscription.current_period_end) {
    throw new Error("O período atual da assinatura não está disponível.");
  }

  if (subscription.plan_id === targetPlanId) {
    throw new Error("O plano selecionado já é o seu plano atual.");
  }

  const [currentContractResult, targetPlanResult, creditsResult] = await Promise.all([
    supabase
      .from("subscription_contracts")
      .select(
        `
          id,
          plan_id,
          plan_name,
          price_cents,
          credits_included,
          interval,
          interval_count
        `
      )
      .eq("subscription_id", subscription.id)
      .eq("status", "active")
      .maybeSingle(),

    supabase
      .from("plans")
      .select(
        `
          id,
          name,
          price,
          credits_included,
          interval,
          interval_count,
          credits_expiration_days,
          external_id,
          is_public,
          is_active
        `
      )
      .eq("id", targetPlanId)
      .eq("is_active", true)
      .eq("is_public", true)
      .maybeSingle(),

    supabase.from("student_credits").select("plan_credits").eq("user_id", user.id).maybeSingle(),
  ]);

  if (currentContractResult.error || !currentContractResult.data) {
    console.error("[PLAN_UPGRADE_CURRENT_CONTRACT_ERROR]", currentContractResult.error);

    throw new Error("Não foi possível carregar o contrato atual da assinatura.");
  }

  if (targetPlanResult.error || !targetPlanResult.data) {
    console.error("[PLAN_UPGRADE_TARGET_PLAN_ERROR]", targetPlanResult.error);

    throw new Error("O novo plano não está disponível.");
  }

  if (creditsResult.error || !creditsResult.data) {
    console.error("[PLAN_UPGRADE_CREDITS_ERROR]", creditsResult.error);

    throw new Error("Não foi possível carregar o saldo de créditos da assinatura.");
  }

  const currentContract = currentContractResult.data;

  const targetPlan = targetPlanResult.data;

  if (currentContract.plan_id !== subscription.plan_id) {
    throw new Error("O contrato ativo não corresponde ao plano atual da assinatura.");
  }

  const currentIntervalCount = currentContract.interval_count ?? 1;

  const targetIntervalCount = targetPlan.interval_count ?? 1;

  if (
    currentContract.interval !== targetPlan.interval ||
    currentIntervalCount !== targetIntervalCount
  ) {
    throw new Error("A troca entre periodicidades diferentes ainda não está disponível.");
  }

  const calculation = calculatePlanUpgrade({
    currentContractPrice: currentContract.price_cents,

    currentContractCredits: currentContract.credits_included,

    remainingSubscriptionCredits: creditsResult.data.plan_credits,

    newPlanPrice: targetPlan.price,

    newPlanCredits: targetPlan.credits_included,

    currentPeriodStart: subscription.current_period_start,

    currentPeriodEnd: subscription.current_period_end,
  });

  return {
    ...calculation,

    subscriptionId: subscription.id,

    subscriptionExternalId: subscription.external_id,

    currentContractId: currentContract.id,

    currentPlan: {
      id: currentContract.plan_id,
      name: currentContract.plan_name,
      price: currentContract.price_cents,
      creditsIncluded: currentContract.credits_included,
    },

    newPlan: {
      id: targetPlan.id,
      name: targetPlan.name,
      price: targetPlan.price,
      creditsIncluded: targetPlan.credits_included,
    },

    newContractTerms: {
      interval: targetPlan.interval,
      intervalCount: targetPlan.interval_count,
      creditsExpirationDays: targetPlan.credits_expiration_days,
      providerPlanId: targetPlan.external_id,
    },
  };
}

export async function executePlanUpgradeService(
  targetPlanId: string
): Promise<ExecutePlanUpgradeResult> {
  try {
    if (!targetPlanId) {
      return {
        success: false,
        message: "O plano de destino é obrigatório.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "Você precisa estar logado para alterar o plano.",
      };
    }

    const preview = await getPlanUpgradePreviewService(targetPlanId);

    if (!preview.subscriptionExternalId) {
      return {
        success: false,
        message: "A assinatura atual não possui vínculo com a Pagar.me.",
      };
    }

    const supabaseAdmin = createAdminClient();

    const { data: currentSubscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        `
          id,
          external_id,
          plan_id,
          status,
          payment_card_id,
          current_period_start,
          current_period_end,
          cancel_at_period_end
        `
      )
      .eq("id", preview.subscriptionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError || !currentSubscription) {
      console.error("[EXECUTE_PLAN_UPGRADE_SUBSCRIPTION_ERROR]", subscriptionError);

      return {
        success: false,
        message: "Não foi possível carregar sua assinatura atual.",
      };
    }

    if (currentSubscription.plan_id !== preview.currentPlan.id) {
      return {
        success: false,
        message: "Seu plano atual foi alterado. Atualize a página antes de tentar novamente.",
      };
    }

    if (currentSubscription.status !== "active" && currentSubscription.status !== "trial") {
      return {
        success: false,
        message: "Sua assinatura atual não permite upgrade.",
      };
    }

    if (currentSubscription.cancel_at_period_end) {
      return {
        success: false,
        message: "Cancele o encerramento agendado antes de alterar o plano.",
      };
    }

    if (!currentSubscription.current_period_start || !currentSubscription.current_period_end) {
      return {
        success: false,
        message: "O ciclo atual da assinatura não está disponível.",
      };
    }

    const paymentContext = await resolvePlanUpgradePaymentContext({
      userId: user.id,

      subscriptionExternalId: preview.subscriptionExternalId,

      paymentCardId: currentSubscription.payment_card_id,
    });

    const subscriptionItem = await resolvePagarmeSubscriptionItem({
      subscriptionExternalId: preview.subscriptionExternalId,
    });

    if (!subscriptionItem) {
      return {
        success: false,
        message: "Não foi possível identificar o item recorrente da assinatura.",
      };
    }

    const paymentReservation = await reservePlanUpgradePayment({
      userId: user.id,

      subscriptionId: preview.subscriptionId,

      currentPlanId: preview.currentPlan.id,

      currentContractId: preview.currentContractId,

      targetPlanId: preview.newPlan.id,

      paymentCardId: paymentContext.localPaymentCardId,

      proratedAmount: preview.proratedAmount,

      originalAmount: preview.originalAmount,

      financialCredit: preview.financialCredit,

      additionalCredits: preview.additionalCredits,

      remainingSubscriptionCredits: preview.remainingSubscriptionCredits,

      currentPeriodStart: preview.currentPeriodStart,

      currentPeriodEnd: preview.currentPeriodEnd,
    });

    const reservedProratedAmount = paymentReservation.amount;

    const reservedAdditionalCredits = paymentReservation.credits_amount;

    if (!reservedAdditionalCredits || reservedAdditionalCredits <= 0) {
      return {
        success: false,
        message: "A reserva do upgrade não possui uma quantidade válida de créditos.",
      };
    }

    const order = await createOrRecoverPlanUpgradeOrder({
      paymentId: paymentReservation.id,

      idempotencyKey: paymentReservation.idempotency_key,

      pagarmeCustomerId: paymentContext.pagarmeCustomerId,

      pagarmeCardId: paymentContext.pagarmeCardId,

      currentPlanId: preview.currentPlan.id,

      currentContractId: preview.currentContractId,

      targetPlanId: preview.newPlan.id,

      proratedAmount: reservedProratedAmount,

      originalAmount: preview.originalAmount,

      financialCredit: preview.financialCredit,

      remainingSubscriptionCredits: preview.remainingSubscriptionCredits,

      currentPeriodStart: preview.currentPeriodStart,

      currentPeriodEnd: preview.currentPeriodEnd,
    });

    const paymentResult = getPagarmeOrderPaymentResult(order);

    await updatePlanUpgradePaymentResult({
      paymentId: paymentReservation.id,

      orderId: order.id,
      orderStatus: paymentResult.status,

      chargeId: paymentResult.chargeId,

      paidAt: paymentResult.paidAt,

      isPaid: paymentResult.isPaid,
    });

    if (!paymentResult.isPaid) {
      const isPending = paymentResult.status === "pending" || paymentResult.status === "processing";

      return {
        success: false,

        message: isPending
          ? "O pagamento ainda está sendo processado. Aguarde alguns instantes antes de tentar novamente."
          : "Não foi possível aprovar a cobrança do upgrade no cartão da assinatura.",
      };
    }

    await updatePagarmeSubscriptionItem({
      subscriptionId: preview.subscriptionExternalId,

      itemId: subscriptionItem.id,

      name: preview.newPlan.name,

      description: `Assinatura do plano ${preview.newPlan.name}`,

      price: preview.newPlan.price,
      quantity: 1,
    });

    const databaseResult = await finalizePlanUpgradeInDatabase({
      userId: user.id,

      subscriptionId: preview.subscriptionId,

      paymentId: paymentReservation.id,

      currentPlanId: preview.currentPlan.id,

      currentContractId: preview.currentContractId,

      targetPlanId: preview.newPlan.id,

      proratedAmount: reservedProratedAmount,

      originalAmount: preview.originalAmount,

      financialCredit: preview.financialCredit,

      additionalCredits: reservedAdditionalCredits,

      remainingSubscriptionCredits: preview.remainingSubscriptionCredits,

      targetPlanName: preview.newPlan.name,

      targetPlanPrice: preview.newPlan.price,

      targetPlanCredits: preview.newPlan.creditsIncluded,

      targetPlanInterval: preview.newContractTerms.interval,

      targetPlanIntervalCount: preview.newContractTerms.intervalCount,

      targetPlanCreditsExpirationDays: preview.newContractTerms.creditsExpirationDays,

      targetProviderPlanId: preview.newContractTerms.providerPlanId,

      orderId: order.id,

      orderStatus: paymentResult.status,

      chargeId: paymentResult.chargeId,

      paidAt: paymentResult.paidAt,

      subscriptionItemId: subscriptionItem.id,

      currentPeriodStart: preview.currentPeriodStart,

      currentPeriodEnd: preview.currentPeriodEnd,
    });

    if (!databaseResult.already_processed) {
      try {
        await syncStudentToDataCrazy(user.id, "subscription_updated");
      } catch (error) {
        console.error("[DATACRAZY_SYNC_ERROR]", {
          user_id: user.id,
          subscription_id: databaseResult.subscription_id,
          payment_id: databaseResult.payment_id,
          event: "subscription_updated",
          error_code: getDataCrazySyncErrorCode(error),
        });
      }
    }

    revalidatePath("/assinatura");
    revalidatePath("/perfil");

    return {
      success: true,

      alreadyProcessed: databaseResult.already_processed,

      paymentId: paymentReservation.id,

      orderId: order.id,

      previousPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      additionalCredits: reservedAdditionalCredits,

      proratedAmount: reservedProratedAmount,
    };
  } catch (error) {
    console.error("[EXECUTE_PLAN_UPGRADE_ERROR]", error);

    return {
      success: false,

      message:
        error instanceof Error ? error.message : "Não foi possível concluir a alteração do plano.",
    };
  }
}
