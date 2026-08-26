export function getMonthlyEquivalentCents(
  totalPriceCents: number,
  months: number,
) {
  if (!Number.isInteger(totalPriceCents) || totalPriceCents < 0) {
    throw new Error("O preço total deve ser informado em centavos.");
  }

  if (!Number.isInteger(months) || months < 1) {
    throw new Error("A quantidade de meses deve ser um inteiro positivo.");
  }

  return Math.round(totalPriceCents / months);
}
