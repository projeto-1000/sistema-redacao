import { onlyDigits, parseCardExpiration } from "@repo/utils";

interface TokenizeCardInput {
  cardNumber: string;
  holderName: string;
  holderDocument?: string | null;
  expirationDate: string;
  cvv: string;
  label?: string;
}

interface PagarmeTokenizedCard {
  last_four_digits?: string;
  holder_name?: string;
  exp_month?: number;
  exp_year?: number;
  brand?: string;
  label?: string;
}

interface PagarmeTokenResponse {
  id: string;
  type: "card";
  created_at?: string;
  expires_at?: string;
  card?: PagarmeTokenizedCard;
}

export class PagarmeTokenizationError extends Error {
  constructor(message = "Não foi possível validar os dados do cartão.") {
    super(message);
    this.name = "PagarmeTokenizationError";
  }
}

export async function tokenizePagarmeCard(input: TokenizeCardInput): Promise<PagarmeTokenResponse> {
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;

  if (!publicKey) {
    throw new PagarmeTokenizationError("A chave pública da Pagar.me não está configurada.");
  }

  const expiration = parseCardExpiration(input.expirationDate);

  if (!expiration) {
    throw new PagarmeTokenizationError("A validade do cartão é inválida.");
  }

  const response = await fetch(
    `https://api.pagar.me/core/v5/tokens?${new URLSearchParams({
      appId: publicKey,
    })}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "card",
        card: {
          number: onlyDigits(input.cardNumber),
          holder_name: input.holderName.trim(),
          holder_document: input.holderDocument ? onlyDigits(input.holderDocument) : undefined,
          exp_month: String(expiration.month),
          exp_year: String(expiration.year),
          cvv: onlyDigits(input.cvv),
          label: input.label,
        },
      }),
    }
  );

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new PagarmeTokenizationError(getTokenizationErrorMessage(data));
  }

  if (!isPagarmeTokenResponse(data)) {
    throw new PagarmeTokenizationError("A Pagar.me não retornou um token válido.");
  }

  return data;
}

function isPagarmeTokenResponse(data: unknown): data is PagarmeTokenResponse {
  if (!data || typeof data !== "object") {
    return false;
  }

  return "id" in data && typeof data.id === "string" && data.id.length > 0;
}

function getTokenizationErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Não foi possível validar os dados do cartão.";
  }

  if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  return "Não foi possível validar os dados do cartão.";
}
