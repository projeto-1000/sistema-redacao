"use server";

import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import {
  buildExtraCreditPurchaseMetadata,
  buildExtraCreditPurchaseReferences,
  evaluateExtraCreditOrder,
} from "@/services/extra-credit-purchase/policy";
import {
  attachPaymentCardToExtraCreditPurchase,
  recordExtraCreditOrderResult,
  reserveExtraCreditPurchase,
} from "@/services/extra-credit-purchase/payment";
import { getOrCreatePagarmeCustomerId } from "@/services/payments/pagarme-customer";
import {
  createAndSavePaymentCard,
  listSavedPaymentCardsForUser,
  resolveSavedPaymentCard,
} from "@/services/payments/payment-cards";
import type { SavedPaymentCard } from "@/types";
import type { StudentCreditSummary } from "@/types/credits";
import { buildPagarmeBillingAddress } from "@/utils/checkout-utils";
import {
  createPagarmeOrder,
  findPagarmeOrderByCode,
  getPagarmeSubscription,
} from "@repo/payments";
import type { CreditPackage, ExtraCreditPurchaseResult } from "@repo/types";
import {
  purchaseExtraCreditsSchema,
  type PurchaseExtraCreditsInput,
} from "@repo/validators";

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

export type { SavedPaymentCard } from "@/types";

export async function getSavedPaymentCards(): Promise<SavedPaymentCard[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return listSavedPaymentCardsForUser({ userId: user.id });
}

export async function canPurchaseExtraCredits() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      eligible: false,
      reason: "UNAUTHENTICATED" as const,
    };
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("id, external_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[EXTRA_CREDITS_SUBSCRIPTION_LOOKUP_ERROR]", error);

    return {
      eligible: false,
      reason: "SUBSCRIPTION_LOOKUP_FAILED" as const,
    };
  }

  if (!subscription) {
    return {
      eligible: false,
      reason: "NO_SUBSCRIPTION" as const,
    };
  }

  if (!subscription.external_id || !subscription.external_id.startsWith("sub_")) {
    return {
      eligible: false,
      reason: "NO_PAID_SUBSCRIPTION" as const,
    };
  }

  try {
    const pagarmeSubscription = await getPagarmeSubscription({
      subscriptionId: subscription.external_id,
    });

    if (pagarmeSubscription.status !== "active") {
      return {
        eligible: false,
        reason: "SUBSCRIPTION_NOT_ACTIVE" as const,
      };
    }

    return {
      eligible: true,
      reason: null,
      subscriptionId: subscription.id,
      pagarmeSubscriptionId: subscription.external_id,
    };
  } catch (error) {
    console.error("[EXTRA_CREDITS_PAGARME_SUBSCRIPTION_CHECK_ERROR]", error);

    return {
      eligible: false,
      reason: "PAGARME_UNAVAILABLE" as const,
    };
  }
}

export async function purchaseExtraCredits(
  input: PurchaseExtraCreditsInput
): Promise<ExtraCreditPurchaseResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      paymentId: null,
      status: "failed",
      creditsAmount: null,
      message: "Você precisa estar logado para comprar créditos extras.",
    };
  }

  const parsedInput = purchaseExtraCreditsSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      paymentId: null,
      status: "failed",
      creditsAmount: null,
      message: "Dados da compra inválidos.",
    };
  }

  let paymentId: string | null = null;
  let creditsAmount: number | null = null;

  try {
    const eligibility = await canPurchaseExtraCredits();

    if (!eligibility.eligible) {
      return {
        success: false,
        paymentId: null,
        status: "failed",
        creditsAmount: null,
        message: "É necessário ter uma assinatura paga ativa para comprar créditos extras.",
      };
    }

    const supabaseAdmin = createAdminClient();
    const { data: packageItem, error: packageError } = await supabaseAdmin
      .from("extra_credit_packages")
      .select("id, name, credits_amount, price_cents, is_active")
      .eq("id", parsedInput.data.packageId)
      .eq("is_active", true)
      .maybeSingle();

    if (packageError) {
      console.error("[EXTRA_CREDIT_PURCHASE_PACKAGE_LOOKUP_ERROR]", packageError);
      throw new Error("Não foi possível consultar o pacote selecionado.");
    }

    if (!packageItem) {
      return {
        success: false,
        paymentId: null,
        status: "failed",
        creditsAmount: null,
        message: "Este pacote de créditos não está disponível.",
      };
    }

    creditsAmount = packageItem.credits_amount;
    const references = buildExtraCreditPurchaseReferences(parsedInput.data.operationId);
    const orderMetadata = buildExtraCreditPurchaseMetadata({
      userId: user.id,
      packageId: packageItem.id,
      creditsAmount: packageItem.credits_amount,
      paymentId: parsedInput.data.operationId,
    });

    const selectedCard =
      parsedInput.data.paymentSource === "saved_card"
        ? await resolveSavedPaymentCard({
            userId: user.id,
            paymentCardId: parsedInput.data.paymentCardId,
          })
        : null;

    const reservation = await reserveExtraCreditPurchase({
      operationId: parsedInput.data.operationId,
      userId: user.id,
      subscriptionId: eligibility.subscriptionId,
      packageId: packageItem.id,
      packageName: packageItem.name,
      amount: packageItem.price_cents,
      creditsAmount: packageItem.credits_amount,
      paymentSource: parsedInput.data.paymentSource,
      paymentCardId: selectedCard?.localCardId ?? null,
      orderCode: references.orderCode,
      idempotencyKey: references.idempotencyKey,
    });

    paymentId = reservation.id;

    let order = await findPagarmeOrderByCode({
      code: references.orderCode,
    });

    if (!order) {
      const pagarmeCustomerId = await getOrCreatePagarmeCustomerId();
      let paymentCard = selectedCard;

      if (!paymentCard && reservation.payment_card_id) {
        paymentCard = await resolveSavedPaymentCard({
          userId: user.id,
          paymentCardId: reservation.payment_card_id,
        });
      }

      if (!paymentCard && parsedInput.data.paymentSource === "new_card") {
        paymentCard = await createAndSavePaymentCard({
          userId: user.id,
          customerId: pagarmeCustomerId,
          cardToken: parsedInput.data.cardToken,
          billingAddress: buildPagarmeBillingAddress(parsedInput.data.billingAddress),
          label: "Cartão salvo",
          metadata: {
            user_id: user.id,
            extra_credit_package_id: packageItem.id,
            source: "extra_credit_purchase",
          },
          idempotencyKey: references.cardIdempotencyKey,
        });
      }

      if (!paymentCard) {
        throw new Error("Não foi possível resolver o cartão da compra.");
      }

      await attachPaymentCardToExtraCreditPurchase({
        paymentId: reservation.id,
        userId: user.id,
        paymentCardId: paymentCard.localCardId,
      });

      order = await createPagarmeOrder({
        code: references.orderCode,
        customerId: pagarmeCustomerId,
        cardId: paymentCard.pagarmeCardId,
        amount: packageItem.price_cents,
        itemCode: `extra-credit-${packageItem.id.replaceAll("-", "")}`,
        itemDescription: packageItem.name.slice(0, 255),
        metadata: orderMetadata,
        idempotencyKey: references.idempotencyKey,
      });
    }

    const decision = evaluateExtraCreditOrder({
      order,
      expectedAmount: packageItem.price_cents,
      expectedCode: references.orderCode,
      expectedMetadata: orderMetadata,
    });

    await recordExtraCreditOrderResult({
      paymentId: reservation.id,
      userId: user.id,
      orderId: order.id,
      orderStatus: order.status,
      decision,
    });

    if (decision.localStatus === "paid" || decision.localStatus === "pending") {
      return {
        success: true,
        paymentId: reservation.id,
        status: decision.localStatus,
        creditsAmount: packageItem.credits_amount,
      };
    }

    return {
      success: false,
      paymentId: reservation.id,
      status: "failed",
      creditsAmount: packageItem.credits_amount,
      message: "Não foi possível aprovar a cobrança no cartão selecionado.",
    };
  } catch (error) {
    console.error("[EXTRA_CREDIT_PURCHASE_ERROR]", {
      user_id: user.id,
      payment_id: paymentId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      success: false,
      paymentId,
      status: paymentId ? "processing" : "failed",
      creditsAmount,
      message: paymentId
        ? "A operação está sendo verificada. Tente novamente com o mesmo identificador."
        : "Não foi possível processar a compra de créditos extras.",
    };
  }
}
