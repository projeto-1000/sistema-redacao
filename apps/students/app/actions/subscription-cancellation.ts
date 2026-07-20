"use server";

import { revalidatePath } from "next/cache";
import { cancelPagarmeSubscription } from "@repo/payments";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import {
  subscriptionCancellationReasons,
  type RequestSubscriptionCancellationInput,
  type RequestSubscriptionCancellationResult,
} from "@/types/subscription-cancellation";

const allowedCancellationReasons = new Set<string>(
  subscriptionCancellationReasons.map((reason) => reason.value)
);

export async function requestSubscriptionCancellation(
  input: RequestSubscriptionCancellationInput
): Promise<RequestSubscriptionCancellationResult> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente para cancelar a assinatura.",
    };
  }

  if (input.reason !== null && !allowedCancellationReasons.has(input.reason)) {
    return {
      success: false,
      message: "O motivo de cancelamento informado é inválido.",
    };
  }

  const cancellationDetails = input.details?.trim() || null;

  if (cancellationDetails && cancellationDetails.length > 500) {
    return {
      success: false,
      message: "Os detalhes do cancelamento devem ter no máximo 500 caracteres.",
    };
  }

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      `
        id,
        user_id,
        plan_id,
        external_id,
        status,
        current_period_end,
        cancel_at_period_end,
        cancellation_effective_at
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error("[CANCELLATION_SUBSCRIPTION_ERROR]", subscriptionError);

    return {
      success: false,
      message: "Não foi possível localizar sua assinatura.",
    };
  }

  if (!subscription) {
    return {
      success: false,
      message: "Você não possui uma assinatura para cancelar.",
    };
  }

  /*
   * Torna a action idempotente no nosso banco.
   * Se o cancelamento já estiver agendado,
   * apenas devolvemos o estado atual.
   */
  if (subscription.cancel_at_period_end) {
    const effectiveAt = subscription.cancellation_effective_at ?? subscription.current_period_end;

    if (!effectiveAt) {
      return {
        success: false,
        message:
          "O cancelamento já foi solicitado, mas a data de encerramento não está disponível.",
      };
    }

    return {
      success: true,
      effectiveAt,
      alreadyScheduled: true,
    };
  }

  if (subscription.status !== "active") {
    return {
      success: false,
      message: "Apenas assinaturas ativas podem ser canceladas.",
    };
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select(
      `
        id,
        name,
        price,
        interval,
        external_id,
        is_public
      `
    )
    .eq("id", subscription.plan_id)
    .maybeSingle();

  if (planError) {
    console.error("[CANCELLATION_PLAN_ERROR]", planError);

    return {
      success: false,
      message: "Não foi possível validar o plano da assinatura.",
    };
  }

  if (!plan) {
    return {
      success: false,
      message: "O plano vinculado à assinatura não foi encontrado.",
    };
  }

  const isFreeTrial = plan.external_id === "internal_free_trial";

  const isMentorship = plan.external_id === "internal_mentoria_free";

  const isLifetime = plan.interval === "lifetime";

  const isPaidPlan = plan.price > 0 && plan.is_public === true;

  if (isFreeTrial || isMentorship || isLifetime || !isPaidPlan) {
    return {
      success: false,
      message: "Este plano não possui uma assinatura recorrente cancelável.",
    };
  }

  if (!subscription.external_id || !subscription.external_id.startsWith("sub_")) {
    console.error("[CANCELLATION_INVALID_EXTERNAL_ID]", {
      subscriptionId: subscription.id,
      externalId: subscription.external_id,
    });

    return {
      success: false,
      message: "A assinatura não possui um identificador válido no provedor de pagamento.",
    };
  }

  if (!subscription.current_period_end) {
    return {
      success: false,
      message: "Não foi possível identificar o fim do período atual.",
    };
  }

  const effectiveAtDate = new Date(subscription.current_period_end);

  if (Number.isNaN(effectiveAtDate.getTime())) {
    return {
      success: false,
      message: "A data de encerramento da assinatura é inválida.",
    };
  }

  if (effectiveAtDate.getTime() <= Date.now()) {
    return {
      success: false,
      message: "O período atual da assinatura já terminou. Atualize a página e tente novamente.",
    };
  }

  const requestedAt = new Date().toISOString();

  try {
    /*
     * A recorrência é encerrada imediatamente
     * no provedor. O acesso restante será
     * controlado pelo nosso banco.
     */
    const canceledSubscription = await cancelPagarmeSubscription({
      subscriptionId: subscription.external_id,
      cancelPendingInvoices: true,
      idempotencyKey: `subscription-cancel-${subscription.external_id}`,
    });

    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        /*
         * O status local permanece active até
         * cancellation_effective_at.
         */
        cancel_at_period_end: true,

        cancellation_requested_at: requestedAt,

        cancellation_effective_at: subscription.current_period_end,

        cancellation_reason: input.reason,

        cancellation_provider_status: canceledSubscription.status,

        provider_canceled_at: canceledSubscription.canceled_at ?? null,

        cancellation_metadata: {
          source: "student_self_service",

          requested_by_user_id: user.id,

          reason: input.reason,

          details: cancellationDetails,

          provider_subscription_id: subscription.external_id,

          provider_status: canceledSubscription.status,

          provider_canceled_at: canceledSubscription.canceled_at ?? null,

          cancel_pending_invoices: true,
        },

        updated_at: requestedAt,
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id)
      .eq("external_id", subscription.external_id)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedSubscription) {
      console.error("[CANCELLATION_LOCAL_UPDATE_ERROR]", {
        error: updateError,
        userId: user.id,
        subscriptionId: subscription.id,
        providerSubscriptionId: subscription.external_id,
        providerResult: canceledSubscription,
      });

      return {
        success: false,
        message:
          "A recorrência foi interrompida, mas não foi possível atualizar a assinatura na plataforma. Nossa equipe precisa verificar o cancelamento.",
      };
    }

    revalidatePath("/assinatura");
    revalidatePath("/assinatura/planos");

    return {
      success: true,
      effectiveAt: subscription.current_period_end,
      alreadyScheduled: false,
    };
  } catch (error) {
    console.error("[REQUEST_SUBSCRIPTION_CANCELLATION_ERROR]", {
      error,
      userId: user.id,
      subscriptionId: subscription.id,
      providerSubscriptionId: subscription.external_id,
    });

    return {
      success: false,
      message:
        "Não foi possível cancelar a assinatura no momento. Nenhuma alteração foi realizada.",
    };
  }
}
