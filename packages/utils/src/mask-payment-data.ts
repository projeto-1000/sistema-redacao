export function maskPaymentAccountNumber(value: string | null | undefined) {
  if (!value) return "Não informado";
  const visible = value.slice(-2);
  return `${"•".repeat(Math.max(4, value.length - visible.length))}${visible}`;
}

export function maskPaymentPixKey(value: string | null | undefined, type: string | null | undefined) {
  if (!value) return "Não informada";

  if (type === "email") {
    const [localPart, domain] = value.split("@");
    if (!domain) return "••••••";
    return `${localPart?.slice(0, 1) ?? ""}•••@${domain}`;
  }

  if (type === "phone") {
    return `(**) *****-${value.replace(/\D/g, "").slice(-4)}`;
  }

  if (type === "cpf") {
    const digits = value.replace(/\D/g, "");
    return `•••.${digits.slice(3, 6)}.${digits.slice(6, 9)}-••`;
  }

  if (type === "cnpj") {
    const digits = value.replace(/\D/g, "");
    return `••.${digits.slice(2, 5)}.${digits.slice(5, 8)}/••••-••`;
  }

  if (value.length <= 8) return "••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
