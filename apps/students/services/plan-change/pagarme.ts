import { createAdminClient } from "@/lib/admin";

import { getPagarmeSubscription, listPagarmeSubscriptionItems } from "@repo/payments";

interface ResolvePlanUpgradePaymentContextParams {
  userId: string;
  subscriptionExternalId: string;
  paymentCardId: string | null;
}

interface PlanUpgradePaymentContext {
  localPaymentCardId: string | null;
  pagarmeCustomerId: string;
  pagarmeCardId: string;
}

export async function resolvePlanUpgradePaymentContext({
  userId,
  subscriptionExternalId,
  paymentCardId,
}: ResolvePlanUpgradePaymentContextParams): Promise<PlanUpgradePaymentContext> {
  if (!subscriptionExternalId.startsWith("sub_")) {
    throw new Error("A assinatura atual não possui um vínculo válido com a Pagar.me.");
  }

  const supabaseAdmin = createAdminClient();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("pagarme_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[PLAN_UPGRADE_PROFILE_ERROR]", profileError);

    throw new Error("Não foi possível carregar os dados de pagamento do aluno.");
  }

  let localCard: {
    id: string;
    pagarme_card_id: string;
  } | null = null;

  if (paymentCardId) {
    const { data: savedCard, error: savedCardError } = await supabaseAdmin
      .from("student_payment_cards")
      .select(
        `
          id,
          pagarme_card_id
        `
      )
      .eq("id", paymentCardId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (savedCardError) {
      console.error("[PLAN_UPGRADE_SAVED_CARD_ERROR]", savedCardError);

      throw new Error("Não foi possível carregar o cartão da assinatura.");
    }

    localCard = savedCard;
  }

  const pagarmeSubscription = await getPagarmeSubscription({
    subscriptionId: subscriptionExternalId,
  });

  if (pagarmeSubscription.payment_method !== "credit_card") {
    throw new Error(
      "A troca automática de plano está disponível apenas para assinaturas pagas com cartão de crédito."
    );
  }

  const pagarmeCustomerId = profile?.pagarme_customer_id ?? pagarmeSubscription.customer?.id;

  const pagarmeCardId = localCard?.pagarme_card_id ?? pagarmeSubscription.card?.id;

  if (!pagarmeCustomerId || !pagarmeCustomerId.startsWith("cus_")) {
    throw new Error("Não foi possível identificar o cliente da assinatura na Pagar.me.");
  }

  if (!pagarmeCardId || !pagarmeCardId.startsWith("card_")) {
    throw new Error("Não foi possível identificar o cartão utilizado na assinatura.");
  }

  return {
    localPaymentCardId: localCard?.id ?? null,

    pagarmeCustomerId,
    pagarmeCardId,
  };
}

interface ResolvePagarmeSubscriptionItemParams {
  subscriptionExternalId: string;
}

export async function resolvePagarmeSubscriptionItem({
  subscriptionExternalId,
}: ResolvePagarmeSubscriptionItemParams) {
  const response = await listPagarmeSubscriptionItems({
    subscriptionId: subscriptionExternalId,
  });

  const activeItems = response.data.filter((item) => item.status === "active" && !item.deleted_at);

  const [subscriptionItem] = activeItems;

  if (!subscriptionItem) {
    throw new Error("Nenhum item recorrente ativo foi encontrado na assinatura.");
  }

  if (activeItems.length > 1) {
    throw new Error(
      "A assinatura possui mais de um item recorrente ativo e não pode ser alterada automaticamente."
    );
  }

  return subscriptionItem;
}
