
export function getFirstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/).find(Boolean) ?? "";
}

//TODO: melhorar loc
type BillingCycle = 'monthly' | 'quarterly' | 'lifetime';

export const billingCycleMap: Record<BillingCycle, { label: string; suffix: string }> = {
  monthly: { label: 'Mensal', suffix: '/mês' },
  quarterly: { label: 'Trimestral', suffix: '/trimestre' },
  lifetime: { label: 'Vitalício', suffix: '' },
};

export function getCycleInfo(interval: string, count: number | null) {
  if (interval === 'month' && count === 1) return { label: 'Mensal', suffix: '/mês' };
  if (interval === 'month' && count === 3) return { label: 'Trimestral', suffix: '/trimestre' };
  if (interval === 'month' && count === 6) return { label: 'Semestral', suffix: '/semestre' };
  if (interval === 'year') return { label: 'Anual', suffix: '/ano' };
  return { label: 'Personalizado', suffix: '' };
}
