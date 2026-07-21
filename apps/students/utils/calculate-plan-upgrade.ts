interface CalculatePlanUpgradeParams {
  currentPlanPrice: number;
  newPlanPrice: number;

  currentPlanCredits: number;
  newPlanCredits: number;

  currentPeriodStart: string;
  currentPeriodEnd: string;

  referenceAt?: Date;
}

export interface PlanUpgradeCalculation {
  priceDifference: number;
  proratedAmount: number;
  additionalCredits: number;

  remainingRatio: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export function calculatePlanUpgrade({
  currentPlanPrice,
  newPlanPrice,
  currentPlanCredits,
  newPlanCredits,
  currentPeriodStart,
  currentPeriodEnd,
  referenceAt = new Date(),
}: CalculatePlanUpgradeParams): PlanUpgradeCalculation {
  if (newPlanPrice <= currentPlanPrice) {
    throw new Error("O novo plano precisa ter um valor superior ao plano atual.");
  }

  if (newPlanCredits <= currentPlanCredits) {
    throw new Error("O novo plano precisa oferecer mais créditos que o plano atual.");
  }

  const periodStart = new Date(currentPeriodStart);
  const periodEnd = new Date(currentPeriodEnd);

  const periodStartTime = periodStart.getTime();
  const periodEndTime = periodEnd.getTime();
  const referenceTime = referenceAt.getTime();

  if (Number.isNaN(periodStartTime) || Number.isNaN(periodEndTime)) {
    throw new Error("O período atual da assinatura é inválido.");
  }

  if (periodEndTime <= periodStartTime) {
    throw new Error("A data final do ciclo precisa ser posterior à data inicial.");
  }

  if (referenceTime >= periodEndTime) {
    throw new Error("O ciclo atual da assinatura já terminou.");
  }

  const totalCycleDuration = periodEndTime - periodStartTime;

  const remainingCycleDuration = periodEndTime - Math.max(referenceTime, periodStartTime);

  const remainingRatio = Math.min(Math.max(remainingCycleDuration / totalCycleDuration, 0), 1);

  const priceDifference = newPlanPrice - currentPlanPrice;

  const calculatedProratedAmount = Math.round(priceDifference * remainingRatio);

  const proratedAmount = remainingRatio > 0 ? Math.max(calculatedProratedAmount, 1) : 0;

  return {
    priceDifference,
    proratedAmount,

    additionalCredits: newPlanCredits - currentPlanCredits,

    remainingRatio,

    currentPeriodStart: periodStart.toISOString(),

    currentPeriodEnd: periodEnd.toISOString(),
  };
}
