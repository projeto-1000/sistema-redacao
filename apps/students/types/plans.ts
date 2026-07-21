export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanData {
  id: string;
  name: string;
  price: number;
  credits_included: number;
  interval: string;
  interval_count: number | null;
  features: PlanFeature[] | string[];
}

export type PlanSelectionMode =
  | "new_subscription"
  | "change_plan"
  | "canceled_subscription"
  | "payment_issue";
