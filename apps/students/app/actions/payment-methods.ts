"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import { getOrCreatePagarmeCustomerId } from "@/services/payments/pagarme-customer";
import {
  createAndSavePaymentCard,
  listSavedPaymentCardsForUser,
  resolveSavedPaymentCard,
  resolveSavedPaymentCardByPagarmeId,
} from "@/services/payments/payment-cards";
import type { PaymentMethodsPageData } from "@/types";
import { buildPagarmeBillingAddress } from "@/utils/checkout-utils";
import { getPagarmeSubscription, updatePagarmeSubscriptionCard } from "@repo/payments";
import {
  addPaymentCardSchema,
  savedPaymentCardIdSchema,
  type AddPaymentCardInput,
} from "@repo/validators";

type PaymentMethodActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

interface ActiveCardSubscription {
  id: string;
  external_id: string | null;
  payment_card_id: string | null;
  payment_method: string | null;
}

async function requireAuthenticatedStudent() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Você precisa estar logado para gerenciar seus cartões.");
  }

  return { supabase, user };
}

async function getActiveCardSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ActiveCardSubscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, external_id, payment_card_id, payment_method")
    .eq("user_id", userId)
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (error) {
    console.error("[PAYMENT_METHODS_SUBSCRIPTION_LOOKUP_ERROR]", error);
    throw new Error("Não foi possível consultar sua assinatura.");
  }

  return data;
}

export async function getPaymentMethodsPageData(): Promise<PaymentMethodsPageData> {
  const { supabase, user } = await requireAuthenticatedStudent();
  const [cards, subscription] = await Promise.all([
    listSavedPaymentCardsForUser({ userId: user.id }),
    getActiveCardSubscription(supabase, user.id),
  ]);

  return {
    cards: cards.map((card) => ({
      ...card,
      isUsedForSubscription: subscription?.payment_card_id === card.id,
    })),
    hasActiveCardSubscription: Boolean(
      subscription &&
        (subscription.payment_method === "credit_card" ||
          subscription.payment_method === "debit_card")
    ),
  };
}

export async function addPaymentCard(
  input: AddPaymentCardInput
): Promise<PaymentMethodActionResult> {
  try {
    const parsedInput = addPaymentCardSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message: parsedInput.error.issues[0]?.message ?? "Dados do cartão inválidos.",
      };
    }

    const { supabase, user } = await requireAuthenticatedStudent();
    const subscription = await getActiveCardSubscription(supabase, user.id);
    const customerId = await getOrCreatePagarmeCustomerId();

    const savedCard = await createAndSavePaymentCard({
      userId: user.id,
      customerId,
      cardToken: parsedInput.data.cardToken,
      billingAddress: buildPagarmeBillingAddress(parsedInput.data.billingAddress),
      label: "Cartão do aluno",
      metadata: {
        user_id: user.id,
        source: "payment_methods",
      },
      makeDefault: false,
    });

    if (!subscription) {
      const supabaseAdmin = createAdminClient();
      const { error: defaultCardError } = await supabaseAdmin.rpc(
        "set_student_default_payment_card",
        {
          p_user_id: user.id,
          p_payment_card_id: savedCard.localCardId,
          p_expected_subscription_id: null,
        }
      );

      if (defaultCardError) {
        console.error("[PAYMENT_METHOD_ADD_DEFAULT_ERROR]", defaultCardError);
        throw new Error(
          "O cartão foi salvo, mas não foi possível defini-lo como padrão. Recarregue a página e tente novamente."
        );
      }
    }

    revalidatePath("/assinatura/metodos-de-pagamento");

    return { success: true, message: "Cartão adicionado com sucesso." };
  } catch (error) {
    console.error("[PAYMENT_METHOD_ADD_ERROR]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Não foi possível adicionar o cartão.",
    };
  }
}

export async function setDefaultPaymentCard(
  paymentCardId: string
): Promise<PaymentMethodActionResult> {
  try {
    const parsedCardId = savedPaymentCardIdSchema.safeParse(paymentCardId);

    if (!parsedCardId.success) {
      return { success: false, message: "Cartão inválido." };
    }

    const { supabase, user } = await requireAuthenticatedStudent();
    const card = await resolveSavedPaymentCard({
      userId: user.id,
      paymentCardId: parsedCardId.data,
    });
    const subscription = await getActiveCardSubscription(supabase, user.id);

    if (subscription) {
      if (
        !subscription.external_id?.startsWith("sub_") ||
        (subscription.payment_method !== "credit_card" &&
          subscription.payment_method !== "debit_card")
      ) {
        return {
          success: false,
          message: "A assinatura ativa não permite troca de cartão.",
        };
      }

      const remoteSubscription = await getPagarmeSubscription({
        subscriptionId: subscription.external_id,
      });

      if (
        remoteSubscription.id !== subscription.external_id ||
        !["active", "trial"].includes(remoteSubscription.status)
      ) {
        return {
          success: false,
          message: "A assinatura não está ativa na Pagar.me.",
        };
      }

      await updatePagarmeSubscriptionCard({
        subscriptionId: subscription.external_id,
        cardId: card.pagarmeCardId,
      });

      const confirmedSubscription = await getPagarmeSubscription({
        subscriptionId: subscription.external_id,
      });

      if (confirmedSubscription.card?.id !== card.pagarmeCardId) {
        throw new Error("A Pagar.me não confirmou o novo cartão da assinatura. Tente novamente.");
      }
    }

    const supabaseAdmin = createAdminClient();
    const { error: localUpdateError } = await supabaseAdmin.rpc(
      "set_student_default_payment_card",
      {
        p_user_id: user.id,
        p_payment_card_id: card.localCardId,
        p_expected_subscription_id: subscription?.id ?? null,
      }
    );

    if (localUpdateError) {
      console.error("[PAYMENT_METHOD_DEFAULT_LOCAL_ERROR]", localUpdateError);
      throw new Error(
        subscription
          ? "O cartão foi atualizado na Pagar.me, mas o vínculo local não foi confirmado. Tente novamente para concluir."
          : "Não foi possível definir o cartão padrão. Tente novamente."
      );
    }

    if (subscription) {
      const latestRemoteSubscription = await getPagarmeSubscription({
        subscriptionId: subscription.external_id!,
      });
      const latestRemoteCardId = latestRemoteSubscription.card?.id;

      if (!latestRemoteCardId?.startsWith("card_")) {
        throw new Error("Não foi possível confirmar o cartão atual da assinatura.");
      }

      if (latestRemoteCardId !== card.pagarmeCardId) {
        const latestLocalCard = await resolveSavedPaymentCardByPagarmeId({
          userId: user.id,
          pagarmeCardId: latestRemoteCardId,
        });
        const { error: convergenceError } = await supabaseAdmin.rpc(
          "set_student_default_payment_card",
          {
            p_user_id: user.id,
            p_payment_card_id: latestLocalCard.localCardId,
            p_expected_subscription_id: subscription.id,
          }
        );

        if (convergenceError) {
          console.error("[PAYMENT_METHOD_DEFAULT_CONVERGENCE_ERROR]", convergenceError);
          throw new Error(
            "Houve outra troca de cartão simultânea. Recarregue a página para confirmar o cartão atual."
          );
        }
      }
    }

    revalidatePath("/assinatura");
    revalidatePath("/assinatura/metodos-de-pagamento");

    return { success: true, message: "Cartão padrão atualizado." };
  } catch (error) {
    console.error("[PAYMENT_METHOD_DEFAULT_ERROR]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Não foi possível atualizar o cartão padrão.",
    };
  }
}

export async function removePaymentCard(paymentCardId: string): Promise<PaymentMethodActionResult> {
  try {
    const parsedCardId = savedPaymentCardIdSchema.safeParse(paymentCardId);

    if (!parsedCardId.success) {
      return { success: false, message: "Cartão inválido." };
    }

    const { user } = await requireAuthenticatedStudent();
    const card = await resolveSavedPaymentCard({
      userId: user.id,
      paymentCardId: parsedCardId.data,
    });
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.rpc("soft_delete_student_payment_card", {
      p_user_id: user.id,
      p_payment_card_id: card.localCardId,
    });

    if (error) {
      console.error("[PAYMENT_METHOD_REMOVE_LOCAL_ERROR]", error);

      if (error.message.includes("payment_card_used_by_active_subscription")) {
        return {
          success: false,
          message:
            "Este cartão é usado na renovação. Torne outro cartão padrão antes de removê-lo.",
        };
      }

      throw new Error("Não foi possível remover o cartão.");
    }

    revalidatePath("/assinatura/metodos-de-pagamento");

    return { success: true, message: "Cartão removido com sucesso." };
  } catch (error) {
    console.error("[PAYMENT_METHOD_REMOVE_ERROR]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Não foi possível remover o cartão.",
    };
  }
}
