export const subscriptionCancellationReasons = [
  {
    value: "price",
    label: "O valor do plano",
  },
  {
    value: "not_using",
    label: "Não estou utilizando a plataforma",
  },
  {
    value: "technical_issues",
    label: "Tive problemas com a plataforma",
  },
  {
    value: "changing_plan",
    label: "Quero trocar de plano",
  },
  {
    value: "other",
    label: "Outro motivo",
  },
] as const;

export type SubscriptionCancellationReason =
  (typeof subscriptionCancellationReasons)[number]["value"];

export interface RequestSubscriptionCancellationInput {
  reason: SubscriptionCancellationReason | null;
  details?: string;
}

export type RequestSubscriptionCancellationResult =
  | {
      success: true;
      effectiveAt: string;
      alreadyScheduled: boolean;
    }
  | {
      success: false;
      message: string;
    };
