export function getPaymentMethodLabel(paymentMethod: string | null) {
  if (paymentMethod === "credit_card") {
    return "Cartão de crédito";
  }

  if (paymentMethod === "debit_card") {
    return "Cartão de débito";
  }

  if (paymentMethod === "boleto") {
    return "Boleto";
  }

  return "Pagamento";
}

export function getSubscriptionStatusLabel(status: string | null) {
  if (status === "active") {
    return "Ativa";
  }

  if (status === "past_due") {
    return "Pagamento pendente";
  }

  if (status === "canceled") {
    return "Cancelada";
  }

  if (status === "trial") {
    return "Período teste";
  }

  return "Aguardando pagamento";
}

export function getCheckoutSuccessDescription(paymentMethod: string | null, status: string | null) {
  if (paymentMethod === "boleto") {
    return "Sua assinatura foi registrada. A liberação dos créditos acontecerá após a confirmação do pagamento do boleto.";
  }

  if (status === "active") {
    return "Sua assinatura foi criada e já está registrada no sistema.";
  }

  return "Sua assinatura foi criada e está aguardando confirmação do pagamento.";
}
