interface CalculatePlanUpgradeParams {
  currentContractPrice: number;
  currentContractCredits: number;
  remainingSubscriptionCredits: number;
  newPlanPrice: number;
  newPlanCredits: number;

  currentPeriodStart: string;
  currentPeriodEnd: string;

  referenceAt?: Date;
}

export interface PlanUpgradeCalculation {
  originalAmount: number;
  financialCredit: number;
  proratedAmount: number;
  additionalCredits: number;
  remainingSubscriptionCredits: number;

  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export function calculatePlanUpgrade({
  currentContractPrice,
  currentContractCredits,
  remainingSubscriptionCredits,
  newPlanPrice,
  newPlanCredits,
  currentPeriodStart,
  currentPeriodEnd,
  referenceAt = new Date(),
}: CalculatePlanUpgradeParams): PlanUpgradeCalculation {
  if (currentContractPrice <= 0 || currentContractCredits <= 0) {
    throw new Error("O contrato atual não possui termos válidos para o upgrade.");
  }

  if (newPlanPrice <= currentContractPrice) {
    throw new Error("O novo plano precisa ter um valor superior ao contrato atual.");
  }

  if (newPlanCredits <= currentContractCredits) {
    throw new Error("O novo plano precisa oferecer mais créditos que o contrato atual.");
  }

  if (
    !Number.isInteger(remainingSubscriptionCredits) ||
    remainingSubscriptionCredits < 0 ||
    remainingSubscriptionCredits > currentContractCredits
  ) {
    throw new Error("O saldo de créditos da assinatura é inválido para o upgrade.");
  }

  const periodStart = new Date(currentPeriodStart);
  const periodEnd = new Date(currentPeriodEnd);

  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    throw new Error("O período atual da assinatura é inválido.");
  }

  if (periodEnd.getTime() <= periodStart.getTime()) {
    throw new Error("A data final do ciclo precisa ser posterior à data inicial.");
  }

  if (referenceAt.getTime() >= periodEnd.getTime()) {
    throw new Error("O ciclo atual da assinatura já terminou.");
  }

  const calculatedAmount =
    newPlanPrice - (remainingSubscriptionCredits * currentContractPrice) / currentContractCredits;

  // A divisão permanece exata até aqui; o único arredondamento é o da cobrança final.
  const proratedAmount = Math.max(Math.round(calculatedAmount), 0);

  return {
    originalAmount: newPlanPrice,
    financialCredit: newPlanPrice - proratedAmount,
    proratedAmount,
    additionalCredits: newPlanCredits - remainingSubscriptionCredits,
    remainingSubscriptionCredits,
    currentPeriodStart: periodStart.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
  };
}
