import type { SubscriptionSupportAction } from "@repo/types";

export const SUBSCRIPTION_SUPPORT_ACTIONS: Record<
  SubscriptionSupportAction,
  { label: string; description: string }
> = {
  cancel_only: {
    label: "Cancelar sem reembolso",
    description: "Interrompe a renovação. Mantém o acesso e os créditos até o fim do período pago.",
  },
  cancel_refund: {
    label: "Cancelar e reembolsar",
    description: "Encerra o acesso e a renovação. Bloqueia os créditos restantes do plano.",
  },
  refund_courtesy: {
    label: "Reembolsar com acesso de cortesia",
    description: "Interrompe a renovação. Mantém os créditos e o acesso definidos como cortesia.",
  },
  refund_only: {
    label: "Reembolsar sem cancelar",
    description: "Devolve o valor selecionado. Mantém a assinatura, a renovação e os créditos.",
  },
};
