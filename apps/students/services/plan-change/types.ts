import type { PlanUpgradeCalculation } from "@/utils/calculate-plan-upgrade";

export interface UpgradePlanSummary {
  id: string;
  name: string;
  price: number;
  creditsIncluded: number;
}

export interface PlanUpgradePreview extends PlanUpgradeCalculation {
  subscriptionId: string;
  subscriptionExternalId: string | null;
  currentContractId: string;

  currentPlan: UpgradePlanSummary;
  newPlan: UpgradePlanSummary;

  newContractTerms: {
    interval: string;
    intervalCount: number | null;
    creditsExpirationDays: number;
    providerPlanId: string | null;
  };
}

export type ExecutePlanUpgradeResult =
  | {
      success: true;
      alreadyProcessed: boolean;

      paymentId: string;
      orderId: string;

      previousPlanId: string;
      targetPlanId: string;

      additionalCredits: number;
      proratedAmount: number;
    }
  | {
      success: false;
      message: string;
    };

export interface DowngradePlanSummary {
  id: string;
  name: string;
  price: number;
  creditsIncluded: number;
}

export interface PlanDowngradePreview {
  subscriptionId: string;
  subscriptionExternalId: string | null;

  currentPeriodEnd: string;

  currentPlan: DowngradePlanSummary;
  newPlan: DowngradePlanSummary;
}

export type SchedulePlanDowngradeResult =
  | {
      success: true;

      subscriptionId: string;
      previousPlanId: string;
      targetPlanId: string;

      scheduledAt: string;
    }
  | {
      success: false;
      message: string;
    };

export type CancelScheduledPlanChangeResult =
  | {
      success: true;
      subscriptionId: string;
      restoredPlanId: string;
    }
  | {
      success: false;
      message: string;
    };
