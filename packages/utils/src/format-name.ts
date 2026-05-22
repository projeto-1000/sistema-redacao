
export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] || "";
}

//TODO: melhorar loc
type BillingCycle = 'monthly' | 'quarterly' | 'lifetime';

export const billingCycleMap: Record<BillingCycle, { label: string; suffix: string }> = {
  monthly: { label: 'Mensal', suffix: '/mês' },
  quarterly: { label: 'Trimestral', suffix: '/trimestre' },
  lifetime: { label: 'Vitalício', suffix: '' },
};