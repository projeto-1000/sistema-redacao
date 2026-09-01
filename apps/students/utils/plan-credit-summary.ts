interface PlanCreditSummaryInput {
  creditsIncluded: number;
  creditsExpirationDays: number;
  interval: string;
  intervalCount: number | null;
}

export interface PlanCreditSummary {
  creditsLabel: string;
  validityLabel: string;
  bonusLabel: string | null;
}

export function getPlanCreditSummary(plan: PlanCreditSummaryInput): PlanCreditSummary {
  const hasMonthlyCreditRelease = plan.interval === "month" && (plan.intervalCount ?? 1) > 1;

  if (hasMonthlyCreditRelease) {
    return {
      creditsLabel: `${plan.creditsIncluded} ${getCorrectionLabel(plan.creditsIncluded)} por mês`,
      validityLabel: "Créditos renovados mensalmente",
      bonusLabel: null,
    };
  }

  const cycleDays = getPlanCycleDays(plan.interval, plan.intervalCount);
  const bonusDays =
    cycleDays && plan.creditsExpirationDays > cycleDays
      ? plan.creditsExpirationDays - cycleDays
      : 0;

  return {
    creditsLabel: `${plan.creditsIncluded} ${getCorrectionLabel(plan.creditsIncluded)} por mês`,
    validityLabel: `Créditos válidos por ${plan.creditsExpirationDays} dias`,
    bonusLabel: bonusDays > 0 ? `+${bonusDays} dias de validade extra` : null,
  };
}

function getCorrectionLabel(quantity: number) {
  return quantity === 1 ? "correção" : "correções";
}

function getPlanCycleDays(interval: string, intervalCount: number | null) {
  const count = intervalCount ?? 1;

  if (interval === "day") return count;
  if (interval === "week") return count * 7;
  if (interval === "month") return count * 30;
  if (interval === "year") return count * 365;

  return null;
}
