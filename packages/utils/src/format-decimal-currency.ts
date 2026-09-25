const decimalCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatDecimalCurrency(value: number) {
  return decimalCurrencyFormatter.format(value);
}
