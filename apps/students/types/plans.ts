export interface PlanData {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  credits_included: number;
  interval: string;
  interval_count: number | null;
  is_recommended: boolean;
  discount_percentage: number | null;
}

export type PlanSelectionMode =
  | "new_subscription"
  | "change_plan"
  | "canceled_subscription"
  | "payment_issue";
