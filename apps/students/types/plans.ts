export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  credits_included: number;
  interval: string;
  interval_count: number | null;
  features: PlanFeature[] | string[];
  is_recommended: boolean;
  discount_percentage: number | null;
  sort_order: number;
}

export type PlanSelectionMode =
  | "new_subscription"
  | "change_plan"
  | "canceled_subscription"
  | "payment_issue";
