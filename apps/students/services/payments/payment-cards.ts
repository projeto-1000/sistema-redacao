import "server-only";

import { createAdminClient } from "@/lib/admin";
import type { SavedPaymentCard } from "@/types";
import { isCheckoutPaymentCardConfirmed } from "@/services/payments/payment-card-policy";
import {
  createPagarmeCard,
  getPagarmeSubscription,
  type PagarmeBillingAddress,
  type PagarmeCard,
} from "@repo/payments";

export async function listSavedPaymentCardsForUser({
  userId,
}: {
  userId: string;
}): Promise<SavedPaymentCard[]> {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("student_payment_cards")
    .select(
      `
        id,
        brand,
        last_four_digits,
        holder_name,
        exp_month,
        exp_year,
        is_default
      `
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[SAVED_PAYMENT_CARDS_LIST_ERROR]", error);
    throw new Error("Não foi possível carregar seus cartões.");
  }

  return (data ?? []).map((card) => ({
    id: card.id,
    brand: card.brand,
    lastFourDigits: card.last_four_digits,
    holderName: card.holder_name,
    expMonth: card.exp_month,
    expYear: card.exp_year,
    isDefault: card.is_default,
  }));
}

interface ResolveSavedPaymentCardParams {
  userId: string;
  paymentCardId: string;
}

export async function resolveSavedPaymentCard({
  userId,
  paymentCardId,
}: ResolveSavedPaymentCardParams) {
  const supabaseAdmin = createAdminClient();
  const { data: card, error } = await supabaseAdmin
    .from("student_payment_cards")
    .select("id, pagarme_card_id")
    .eq("id", paymentCardId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[PAYMENT_CARD_LOOKUP_ERROR]", error);
    throw new Error("Não foi possível consultar o cartão selecionado.");
  }

  if (!card?.pagarme_card_id?.startsWith("card_")) {
    throw new Error("O cartão selecionado não está disponível.");
  }

  return {
    localCardId: card.id,
    pagarmeCardId: card.pagarme_card_id,
    createdLocally: false,
  };
}

interface CreateAndSavePaymentCardParams {
  userId: string;
  customerId: string;
  cardToken: string;
  billingAddress: PagarmeBillingAddress;
  label: string;
  metadata: Record<string, string>;
  idempotencyKey?: string;
  makeDefault?: boolean;
  preserveExistingCardState?: boolean;
}

export interface SavedPaymentCardReference {
  localCardId: string;
  pagarmeCardId: string;
  createdLocally: boolean;
}

function assertValidPagarmeCard(card: PagarmeCard) {
  if (
    !card.id?.startsWith("card_") ||
    !/^\d{4}$/.test(card.last_four_digits) ||
    !Number.isInteger(card.exp_month) ||
    card.exp_month < 1 ||
    card.exp_month > 12 ||
    !Number.isInteger(card.exp_year)
  ) {
    throw new Error("A Pagar.me não retornou um cartão válido.");
  }
}

export async function createAndSavePaymentCard({
  userId,
  customerId,
  cardToken,
  billingAddress,
  label,
  metadata,
  idempotencyKey,
  makeDefault = true,
  preserveExistingCardState = false,
}: CreateAndSavePaymentCardParams): Promise<SavedPaymentCardReference> {
  const pagarmeCard = await createPagarmeCard({
    customerId,
    cardToken,
    billingAddress,
    label,
    metadata,
    idempotencyKey,
  });

  assertValidPagarmeCard(pagarmeCard);

  const supabaseAdmin = createAdminClient();
  const { data: existingCard, error: existingCardError } = await supabaseAdmin
    .from("student_payment_cards")
    .select("id, user_id, is_default")
    .eq("pagarme_card_id", pagarmeCard.id)
    .maybeSingle();

  if (existingCardError) {
    console.error("[PAYMENT_CARD_EXISTING_LOOKUP_ERROR]", existingCardError);
    throw new Error("Não foi possível verificar o cartão do aluno.");
  }

  if (existingCard && existingCard.user_id !== userId) {
    throw new Error("O cartão retornado não pertence ao aluno autenticado.");
  }

  const now = new Date().toISOString();
  if (makeDefault) {
    const { error: resetDefaultCardError } = await supabaseAdmin
      .from("student_payment_cards")
      .update({
        is_default: false,
        updated_at: now,
      })
      .eq("user_id", userId)
      .eq("is_default", true)
      .is("deleted_at", null);

    if (resetDefaultCardError) {
      throw new Error("Não foi possível atualizar o cartão padrão.");
    }
  }

  const safeCardFields = {
    brand: pagarmeCard.brand,
    last_four_digits: pagarmeCard.last_four_digits,
    holder_name: pagarmeCard.holder_name,
    exp_month: pagarmeCard.exp_month,
    exp_year: pagarmeCard.exp_year,
    is_active: true,
    deleted_at: null,
    updated_at: now,
  };

  if (existingCard) {
    if (preserveExistingCardState) {
      return {
        localCardId: existingCard.id,
        pagarmeCardId: pagarmeCard.id,
        createdLocally: false,
      };
    }

    const { error: updateCardError } = await supabaseAdmin
      .from("student_payment_cards")
      .update({
        ...safeCardFields,
        ...(makeDefault ? { is_default: true } : {}),
      })
      .eq("id", existingCard.id)
      .eq("user_id", userId);

    if (updateCardError) {
      throw new Error("Não foi possível atualizar o cartão do aluno.");
    }

    return {
      localCardId: existingCard.id,
      pagarmeCardId: pagarmeCard.id,
      createdLocally: false,
    };
  }

  const { data: savedCard, error: savedCardError } = await supabaseAdmin
    .from("student_payment_cards")
    .insert({
      user_id: userId,
      pagarme_card_id: pagarmeCard.id,
      is_default: makeDefault,
      ...safeCardFields,
    })
    .select("id")
    .single();

  if (savedCardError?.code === "23505") {
    const concurrentCard = await resolveSavedPaymentCardByPagarmeId({
      userId,
      pagarmeCardId: pagarmeCard.id,
    });

    return {
      ...concurrentCard,
      createdLocally: false,
    };
  }

  if (savedCardError || !savedCard) {
    throw new Error("Não foi possível salvar o cartão do aluno.");
  }

  return {
    localCardId: savedCard.id,
    pagarmeCardId: pagarmeCard.id,
    createdLocally: true,
  };
}

export async function reconcileInitialCheckoutPaymentCard({
  subscriptionExternalId,
  status,
}: {
  subscriptionExternalId: string;
  status: "paid" | "failed";
}) {
  const supabaseAdmin = createAdminClient();
  const { data: payment, error } = await supabaseAdmin
    .from("student_payments")
    .select("user_id, payment_card_id, metadata")
    .eq("kind", "subscription")
    .eq("provider", "pagarme")
    .eq("external_id", subscriptionExternalId)
    .maybeSingle();

  if (error) {
    console.error("[CHECKOUT_PAYMENT_CARD_RECONCILIATION_LOOKUP_ERROR]", error);
    throw new Error("Não foi possível recuperar o cartão do checkout.");
  }

  if (!payment?.payment_card_id) {
    return;
  }

  const metadata =
    payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? payment.metadata
      : {};

  if (status === "paid") {
    if (metadata.payment_card_promotion_pending !== true) {
      return;
    }

    const card = await resolveSavedPaymentCard({
      userId: payment.user_id,
      paymentCardId: payment.payment_card_id,
    });
    const remoteSubscription = await getPagarmeSubscription({
      subscriptionId: subscriptionExternalId,
    });

    if (
      !isCheckoutPaymentCardConfirmed({
        expectedSubscriptionId: subscriptionExternalId,
        actualSubscriptionId: remoteSubscription.id,
        subscriptionStatus: remoteSubscription.status,
        expectedCardId: card.pagarmeCardId,
        actualCardId: remoteSubscription.card?.id,
      })
    ) {
      throw new Error("A Pagar.me não confirmou o cartão aprovado da assinatura.");
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("external_id", subscriptionExternalId)
      .eq("user_id", payment.user_id)
      .in("status", ["active", "trial"])
      .maybeSingle();

    if (subscriptionError) {
      console.error("[CHECKOUT_PAYMENT_CARD_SUBSCRIPTION_LOOKUP_ERROR]", subscriptionError);
      throw new Error("Não foi possível confirmar a assinatura local do cartão aprovado.");
    }

    if (!subscription) {
      return;
    }

    await setPaymentCardAsDefaultAtomically({
      userId: payment.user_id,
      paymentCardId: payment.payment_card_id,
      expectedSubscriptionId: subscription.id,
    });
    return;
  }

  if (metadata.payment_card_created_for_operation === true) {
    await deactivatePaymentCardCreatedForOperation({
      userId: payment.user_id,
      paymentCardId: payment.payment_card_id,
    });
  }
}

export async function setPaymentCardAsDefaultAtomically({
  userId,
  paymentCardId,
  expectedSubscriptionId,
}: {
  userId: string;
  paymentCardId: string;
  expectedSubscriptionId: string | null;
}) {
  const supabaseAdmin = createAdminClient();
  const now = new Date().toISOString();
  const { data: card, error: activateCardError } = await supabaseAdmin
    .from("student_payment_cards")
    .update({
      is_active: true,
      deleted_at: null,
      updated_at: now,
    })
    .eq("id", paymentCardId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (activateCardError || !card) {
    console.error("[PAYMENT_CARD_ACTIVATION_ERROR]", activateCardError);
    throw new Error("Não foi possível ativar o cartão aprovado.");
  }

  const { error: promoteCardError } = await supabaseAdmin.rpc(
    "set_student_default_payment_card",
    {
      p_user_id: userId,
      p_payment_card_id: paymentCardId,
      p_expected_subscription_id: expectedSubscriptionId,
    }
  );

  if (promoteCardError) {
    console.error("[PAYMENT_CARD_ATOMIC_PROMOTION_ERROR]", promoteCardError);
    throw new Error("Não foi possível definir o cartão aprovado como padrão.");
  }
}

export async function deactivatePaymentCardCreatedForOperation({
  userId,
  paymentCardId,
}: {
  userId: string;
  paymentCardId: string;
}) {
  const supabaseAdmin = createAdminClient();
  const { data: activeSubscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("payment_card_id", paymentCardId)
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (subscriptionError) {
    console.error("[PAYMENT_CARD_CLEANUP_SUBSCRIPTION_ERROR]", subscriptionError);
    throw new Error("Não foi possível validar o uso atual do cartão recusado.");
  }

  if (activeSubscription) {
    throw new Error("Um cartão vinculado a uma assinatura ativa não pode ser desativado.");
  }

  const { error: cleanupError } = await supabaseAdmin
    .from("student_payment_cards")
    .update({
      is_default: false,
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentCardId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (cleanupError) {
    console.error("[PAYMENT_CARD_CLEANUP_ERROR]", cleanupError);
    throw new Error("Não foi possível remover o cartão recusado.");
  }
}

export async function resolveSavedPaymentCardByPagarmeId({
  userId,
  pagarmeCardId,
}: {
  userId: string;
  pagarmeCardId: string;
}) {
  const supabaseAdmin = createAdminClient();
  const { data: card, error } = await supabaseAdmin
    .from("student_payment_cards")
    .select("id, user_id")
    .eq("pagarme_card_id", pagarmeCardId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !card || card.user_id !== userId) {
    console.error("[PAYMENT_CARD_CONCURRENT_RECOVERY_ERROR]", error);
    throw new Error("Não foi possível recuperar o cartão do aluno.");
  }

  return {
    localCardId: card.id,
    pagarmeCardId,
    createdLocally: false,
  };
}
