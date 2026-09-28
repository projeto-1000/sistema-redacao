"use server";

import { revalidatePath } from "next/cache";
import { cancelPagarmeSubscription } from "@repo/payments";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import {
  holdSubscriptionRenewalForManualReview,
  startSubscriptionWithdrawalRefund,
} from "@/services/subscription-withdrawal";
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

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.operationId)) {
    return {
      success: false,
      message: "Não foi possível identificar esta solicitação. Atualize a página e tente novamente.",
    };
  }

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
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        cancellation_mode,
        withdrawal_status,
        active_withdrawal_request_id,
        cancellation_requested_at,
        cancellation_effective_at,
        cancellation_provider_status
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

  if (
    subscription.cancellation_mode === "end_of_period" &&
    subscription.cancel_at_period_end &&
    subscription.cancellation_provider_status === "canceled"
  ) {
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
      kind: "ordinary",
      effectiveAt,
      alreadyScheduled: true,
    };
  }

  if (subscription.withdrawal_status && subscription.active_withdrawal_request_id) {
    return {
      success: true,
      kind:
        subscription.withdrawal_status === "under_review"
          ? "withdrawal_manual"
          : subscription.withdrawal_status === "operational_issue"
            ? "withdrawal_operational_issue"
            : "withdrawal_automatic",
      effectiveAt: null,
      alreadyScheduled: true,
      withdrawalStatus: subscription.withdrawal_status,
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
          external_id
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

  const isPaidPlan = plan.price > 0;

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

  const { data: initialPayment, error: initialPaymentError } = await supabaseAdmin
    .from("student_payments")
    .select("id, paid_at")
    .eq("user_id", user.id)
    .eq("subscription_id", subscription.id)
    .eq("kind", "subscription")
    .in("status", ["paid", "active"])
    .not("paid_at", "is", null)
    .or(
      `external_id.eq.${subscription.external_id},metadata->>pagarme_subscription_id.eq.${subscription.external_id}`
    )
    .order("paid_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (initialPaymentError) {
    console.error("[CANCELLATION_INITIAL_PAYMENT_ERROR]", initialPaymentError);
  }

  const activatedAt = initialPayment?.paid_at ?? subscription.current_period_start;
  const withdrawalDeadline = activatedAt
    ? new Date(activatedAt).getTime() + 168 * 60 * 60 * 1000
    : Number.NaN;

  if (!Number.isNaN(withdrawalDeadline) && Date.now() <= withdrawalDeadline) {
    const { data: withdrawalData, error: withdrawalError } = await supabase.rpc(
      "request_subscription_withdrawal",
      {
        p_idempotency_key: input.operationId,
        p_reason: input.reason,
        p_details: cancellationDetails,
      }
    );

    if (withdrawalError || !withdrawalData) {
      console.error("[REQUEST_SUBSCRIPTION_WITHDRAWAL_ERROR]", withdrawalError);

      return {
        success: false,
        message: "Não foi possível registrar o pedido de arrependimento.",
      };
    }

    const withdrawal = withdrawalData as {
      request_id: string;
      processing_mode: "automatic" | "manual";
      status: "under_review" | "refund_processing" | "refunded" | "operational_issue";
      provider_subscription_id: string;
      subscription_id: string;
      original_activated_at: string;
      duplicate?: boolean;
    };

    if (!withdrawal.duplicate) {
      try {
        if (withdrawal.processing_mode === "automatic") {
          await startSubscriptionWithdrawalRefund({
            requestId: withdrawal.request_id,
            userId: user.id,
            subscriptionId: withdrawal.subscription_id,
            providerSubscriptionId: withdrawal.provider_subscription_id,
            originalActivatedAt: withdrawal.original_activated_at,
          });
        } else {
          await holdSubscriptionRenewalForManualReview({
            requestId: withdrawal.request_id,
            providerSubscriptionId: withdrawal.provider_subscription_id,
          });
        }
      } catch (error) {
        console.error("[PROCESS_SUBSCRIPTION_WITHDRAWAL_ERROR]", {
          error,
          requestId: withdrawal.request_id,
          processingMode: withdrawal.processing_mode,
        });

        revalidatePath("/assinatura");
        revalidatePath("/assinatura/planos");

        return {
          success: true,
          kind: "withdrawal_operational_issue",
          effectiveAt: null,
          alreadyScheduled: false,
          withdrawalStatus: "operational_issue",
        };
      }
    }

    revalidatePath("/assinatura");
    revalidatePath("/assinatura/planos");

    return {
      success: true,
      kind:
        withdrawal.processing_mode === "automatic"
          ? "withdrawal_automatic"
          : "withdrawal_manual",
      effectiveAt: null,
      alreadyScheduled: withdrawal.duplicate ?? false,
      withdrawalStatus: withdrawal.status,
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

  const requestedAt = subscription.cancellation_requested_at ?? new Date().toISOString();

  try {
    const { data: scheduledSubscription, error: scheduleCancellationError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,

        cancellation_mode: "end_of_period",

        withdrawal_status: null,

        active_withdrawal_request_id: null,

        cancellation_requested_at: requestedAt,

        cancellation_effective_at: subscription.current_period_end,

        cancellation_reason: input.reason,

        cancellation_provider_status: "pending",

        provider_canceled_at: null,

        cancellation_metadata: {
          source: "student_self_service",

          requested_by_user_id: user.id,

          reason: input.reason,

          details: cancellationDetails,

          provider_subscription_id: subscription.external_id,

          provider_status: "pending",

          provider_canceled_at: null,

          cancel_pending_invoices: true,
        },
        pending_plan_id: null,
        pending_change_type: null,
        pending_change_at: null,

        updated_at: requestedAt,
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id)
      .eq("external_id", subscription.external_id)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (scheduleCancellationError || !scheduledSubscription) {
      console.error("[SCHEDULE_SUBSCRIPTION_CANCELLATION_ERROR]", {
        error: scheduleCancellationError,
        userId: user.id,
        subscriptionId: subscription.id,
        providerSubscriptionId: subscription.external_id,
      });

      return {
        success: false,
        message: "Não foi possível agendar o cancelamento da assinatura.",
      };
    }

    const canceledSubscription = await cancelPagarmeSubscription({
      subscriptionId: subscription.external_id,

      cancelPendingInvoices: true,

      idempotencyKey: `subscription-cancel-${subscription.external_id}`,
    });

    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
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

        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id)
      .eq("external_id", subscription.external_id)
      .eq("cancel_at_period_end", true)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedSubscription) {
      console.error("[CANCELLATION_LOCAL_CONFIRMATION_ERROR]", {
        error: updateError,
        userId: user.id,
        subscriptionId: subscription.id,
        providerSubscriptionId: subscription.external_id,
        providerResult: canceledSubscription,
      });

      return {
        success: false,
        message:
          "A renovação foi interrompida, mas não foi possível confirmar o resultado na plataforma. O cancelamento permanece agendado.",
      };
    }

    revalidatePath("/assinatura");
    revalidatePath("/assinatura/planos");

    return {
      success: true,
      kind: "ordinary",
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

    revalidatePath("/assinatura");
    revalidatePath("/assinatura/planos");

    return {
      success: false,
      message:
        "O cancelamento foi registrado, mas ainda não foi possível confirmar o resultado com o provedor de pagamento. Tente novamente.",
    };
  }
}
