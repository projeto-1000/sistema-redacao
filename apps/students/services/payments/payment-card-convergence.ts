interface RemoteSubscriptionCardState {
  id: string;
  status: string;
  card?: {
    id?: string;
  } | null;
}

interface ConvergeSubscriptionPaymentCardParams {
  subscriptionId: string;
  requestedPagarmeCardId: string;
  requestedLocalCardId: string;
  readRemoteSubscription: () => Promise<RemoteSubscriptionCardState>;
  updateRemoteCard: () => Promise<void>;
  applyLocalCard: (localCardId: string) => Promise<void>;
  resolveLocalCardIdByPagarmeCardId: (pagarmeCardId: string) => Promise<string>;
}

export class RemotePaymentCardNotConfirmedError extends Error {
  constructor() {
    super("A Pagar.me não confirmou o novo cartão da assinatura. Tente novamente.");
    this.name = "RemotePaymentCardNotConfirmedError";
  }
}

export class LocalPaymentCardConvergenceError extends Error {
  constructor(cause?: unknown) {
    super(
      "A Pagar.me já está usando este cartão, mas o vínculo local não foi confirmado. Tente novamente para concluir.",
      { cause }
    );
    this.name = "LocalPaymentCardConvergenceError";
  }
}

function assertRemoteSubscriptionIsEligible(
  remoteSubscription: RemoteSubscriptionCardState,
  subscriptionId: string
) {
  if (
    remoteSubscription.id !== subscriptionId ||
    !["active", "trial"].includes(remoteSubscription.status)
  ) {
    throw new Error("A assinatura não está ativa na Pagar.me.");
  }
}

export async function convergeSubscriptionPaymentCard({
  subscriptionId,
  requestedPagarmeCardId,
  requestedLocalCardId,
  readRemoteSubscription,
  updateRemoteCard,
  applyLocalCard,
  resolveLocalCardIdByPagarmeCardId,
}: ConvergeSubscriptionPaymentCardParams) {
  const initialRemoteSubscription = await readRemoteSubscription();
  assertRemoteSubscriptionIsEligible(initialRemoteSubscription, subscriptionId);

  if (initialRemoteSubscription.card?.id !== requestedPagarmeCardId) {
    await updateRemoteCard();

    const confirmedRemoteSubscription = await readRemoteSubscription();
    assertRemoteSubscriptionIsEligible(confirmedRemoteSubscription, subscriptionId);

    if (confirmedRemoteSubscription.card?.id !== requestedPagarmeCardId) {
      throw new RemotePaymentCardNotConfirmedError();
    }
  }

  try {
    await applyLocalCard(requestedLocalCardId);
  } catch (error) {
    throw new LocalPaymentCardConvergenceError(error);
  }

  const latestRemoteSubscription = await readRemoteSubscription();
  assertRemoteSubscriptionIsEligible(latestRemoteSubscription, subscriptionId);

  const latestRemoteCardId = latestRemoteSubscription.card?.id;

  if (!latestRemoteCardId?.startsWith("card_")) {
    throw new Error("Não foi possível confirmar o cartão atual da assinatura.");
  }

  if (latestRemoteCardId !== requestedPagarmeCardId) {
    const latestLocalCardId = await resolveLocalCardIdByPagarmeCardId(latestRemoteCardId);

    try {
      await applyLocalCard(latestLocalCardId);
    } catch (error) {
      throw new LocalPaymentCardConvergenceError(error);
    }
  }
}
