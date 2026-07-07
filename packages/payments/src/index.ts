import "server-only";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";
const SECRET_KEY = process.env.PAGARME_SECRET_KEY;

export async function fetchPagarme<TResponse = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<TResponse> {
  if (!SECRET_KEY) {
    throw new Error("CRITICAL_ERROR: Chave secreta do Pagar.me não encontrada.");
  }

  const encodedCredentials = Buffer.from(`${SECRET_KEY}:`).toString("base64");

  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    console.error("[PAGARME_API_ERROR]", {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      errorData,
    });

    throw new Error(
      `Falha na requisição ao Pagar.me: ${response.status} - ${response.statusText}`
    );
  }

  return response.json() as Promise<TResponse>;
}

 export interface CreateCustomerParams {
  id: string;
  name: string;
  email: string;
  document: string;
  phoneCountryCode: string;
  phone: string;
}

 export interface PagarmePhone {
  country_code: string;
  area_code: string;
  number: string;
}

 export interface PagarmePhones {
  mobile_phone: PagarmePhone;
}

 export interface PagarmeCustomer {
  id: string;
  name: string;
  email: string;
  code?: string;
  document?: string;
  document_type?: string;
  type?: string;
  phones?: PagarmePhones;
  created_at?: string;
  updated_at?: string;
}

export async function createPagarmeCustomer({
  id,
  name,
  email,
  document,
  phoneCountryCode,
  phone,
}: CreateCustomerParams) {
  const payload = {
    name,
    email,
    code: id,
    type: "individual",
    document,
    document_type: "CPF",
    phones: {
      mobile_phone: {
        country_code: phoneCountryCode,
        area_code: phone.slice(0, 2),
        number: phone.slice(2),
      },
    },
  };

  const customer = await fetchPagarme<PagarmeCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return customer;
}

 export interface PagarmeBillingAddress {
  line_1: string;
  line_2?: string;
  zip_code: string;
  city: string;
  state: string;
  country: "BR";
}

 export interface CreatePagarmeCardParams {
  customerId: string;
  cardToken: string;
  billingAddress: PagarmeBillingAddress;
  label?: string;
  verifyCard?: boolean;
  metadata?: Record<string, string>;
}

 export interface PagarmeCard {
  id: string;
  first_six_digits?: string;
  last_four_digits: string;
  brand: string;
  holder_name: string;
  holder_document?: string;
  exp_month: number;
  exp_year: number;
  status: string;
  type?: string;
  label?: string;
  created_at?: string;
  updated_at?: string;
  billing_address?: PagarmeBillingAddress;
}

export async function createPagarmeCard({
  customerId,
  cardToken,
  billingAddress,
  label,
  verifyCard = true,
  metadata,
}: CreatePagarmeCardParams) {
  const payload = {
    token: cardToken,
    label,
    billing_address: billingAddress,
    options: {
      verify_card: verifyCard,
    },
    metadata,
  };

  return fetchPagarme<PagarmeCard>(`/customers/${customerId}/cards`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PagarmePaymentMethod = "credit_card" | "debit_card" | "boleto";

export interface CreatePagarmeSubscriptionParams {
  code: string;
  planId: string;
  customerId: string;
  paymentMethod: PagarmePaymentMethod;
  billingAddress: PagarmeBillingAddress;
  cardToken?: string;
  cardId?: string;
  boletoDueDays?: number;
  metadata?: Record<string, string>;
}

export interface PagarmeSubscriptionCycle {
  id?: string;
  start_at?: string;
  end_at?: string;
  billing_at?: string;
}

export interface PagarmeSubscription {
  id: string;
  code?: string;
  payment_method: PagarmePaymentMethod;
  status: string;
  currency?: string;
  interval?: string;
  interval_count?: number;
  billing_type?: string;
  current_cycle?: PagarmeSubscriptionCycle;
  next_billing_at?: string;
  installments?: number;
  boleto_due_days?: number;
  created_at?: string;
  updated_at?: string;
  customer?: PagarmeCustomer;
  card?: PagarmeCard;
  metadata?: Record<string, string>;
}

export async function createPagarmeSubscription({
  code,
  planId,
  customerId,
  paymentMethod,
  billingAddress,
  cardToken,
  cardId,
  boletoDueDays = 3,
  metadata,
}: CreatePagarmeSubscriptionParams) {
  const isCardPayment =
    paymentMethod === "credit_card" || paymentMethod === "debit_card";

  if (isCardPayment && !cardToken && !cardId) {
    throw new Error(
      "É necessário informar cardToken ou cardId para pagamento com cartão."
    );
  }

  if (cardToken && !cardToken.startsWith("token_")) {
    throw new Error("Token do cartão inválido.");
  }

  if (cardId && !cardId.startsWith("card_")) {
    throw new Error("ID do cartão inválido.");
  }

  const payload = {
    code,
    plan_id: planId,
    customer_id: customerId,
    payment_method: paymentMethod,
    installments: 1,

    card_token: isCardPayment && !cardId ? cardToken : undefined,
    card_id: isCardPayment && cardId ? cardId : undefined,

    card: isCardPayment
      ? {
          billing_address: billingAddress,
        }
      : undefined,

    boleto_due_days: paymentMethod === "boleto" ? boletoDueDays : undefined,

    metadata,
  };

  return fetchPagarme<PagarmeSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}