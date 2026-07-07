export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanData {
  id: string;
  name: string;
  price: number;
  interval: string;
  interval_count: number | null;
  features: PlanFeature[] | string[];
}
