"use server";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanData {
  id: string;
  name: string;
  badge?: string;
  price: number;
  features: PlanFeature[];
}

const MOCK_PLANS: PlanData[] = [
  {
    id: "plan_basic",
    name: "Plano Basic",
    badge: "ESSENCIAL",
    price: 49.9,
    features: [
      { text: "4 correções/mês", included: true },
      { text: "Feedback detalhado", included: true },
      { text: "Prioridade na fila", included: false },
    ],
  },
  {
    id: "plan_premium",
    name: "Plano Premium",
    price: 89.9,
    features: [
      { text: "Tudo do plano basic", included: true },
      { text: "Suporte Prioritário", included: true },
      { text: "Acesso a temas exclusivos", included: true },
    ],
  },
];

export async function getAvailablePlans(): Promise<PlanData[]> {
  return MOCK_PLANS;
}

export async function getCurrentUserPlanId(): Promise<string> {
  // Alterado para o Basic ser o default do usuário
  return "plan_basic";
}
