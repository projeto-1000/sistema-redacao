import "server-only";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";
const SECRET_KEY = process.env.PAGARME_SECRET_KEY;

const WEBHOOK_LOOKUP_RETRY_DELAYS_MS = [
  250,
  500,
  1000,
  2000,
] as const;

export class PagarmeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly errorData: unknown
  ) {
    super(message);

    this.name = "PagarmeApiError";
  }
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isRetryableWebhookLookupError(
  error: unknown
) {
  if (!(error instanceof PagarmeApiError)) {
    return false;
  }

  if (
    error.status === 404 ||
    error.status === 429 ||
    error.status >= 500
  ) {
    return true;
  }

  if (error.status !== 400) {
    return false;
  }

  const serializedError =
    JSON.stringify(error.errorData)
      .toLowerCase();

  return serializedError.includes(
    "webhook not found"
  );
}


export async function fetchPagarme<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!SECRET_KEY) {
    throw new Error(
      "PAGARME_SECRET_KEY não configurada."
    );
  }

  const authorization = Buffer.from(
    `${SECRET_KEY}:`
  ).toString("base64");

  const response = await fetch(
    `${PAGARME_API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        Authorization:
          `Basic ${authorization}`,

        Accept: "application/json",
        "Content-Type": "application/json",

        ...options.headers,
      },

      cache: "no-store",
    }
  );

  const rawResponse =
    await response.text();

  let responseData: unknown = null;

  if (rawResponse) {
    try {
      responseData =
        JSON.parse(rawResponse);
    } catch {
      responseData = rawResponse;
    }
  }

  if (!response.ok) {
    console.error(
      "[PAGARME_API_ERROR]",
      {
        endpoint,
        status: response.status,
        statusText:
          response.statusText,
        errorData: responseData,
      }
    );

    throw new PagarmeApiError(
      `Falha na requisição ao Pagar.me: ${response.status} - ${response.statusText}`,
      response.status,
      response.statusText,
      responseData
    );
  }

  return responseData as T;
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
  canceled_at?: string;
  customer?: PagarmeCustomer;
  card?: PagarmeCard;
  items?: PagarmeSubscriptionItem[];
  metadata?: Record<string, string>;
}

export type PagarmeInvoiceStatus =
  | "pending"
  | "paid"
  | "canceled"
  | "scheduled"
  | "failed";

export interface PagarmeInvoicePeriod {
  start_at?: string;
  end_at?: string;
}

export interface PagarmeInvoiceTransaction {
  id?: string;
  status?: string;
  success?: boolean;
  created_at?: string;
  updated_at?: string;
  acquirer_return_code?: string | number | null;
  acquirer_message?: string | null;
  gateway_response?: {
    code?: string | number | null;
    message?: string | null;
  };
}

export interface PagarmeInvoiceCharge {
  id?: string;
  status?: string;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  recurrence_cycle?: string | null;
  last_transaction?: PagarmeInvoiceTransaction;
}

export interface PagarmeInvoice {
  id: string;
  amount: number;
  status: PagarmeInvoiceStatus;
  payment_method?: string;
  billing_at?: string | null;
  due_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  canceled_at?: string | null;
  period?: PagarmeInvoicePeriod;
  cycle?: PagarmeInvoicePeriod;
  charge?: PagarmeInvoiceCharge;
  subscription?: {
    id?: string;
    code?: string;
    status?: string;
  };
  metadata?: Record<string, string>;
}

export interface ListPagarmeInvoicesParams {
  subscriptionId: string;
  page?: number;
  size?: number;
}

export interface ListPagarmeSubscriptionInvoicesParams {
  subscriptionId: string;
  pageSize?: number;
  maxPages?: number;
}

export interface PagarmeInvoiceHistory {
  invoices: PagarmeInvoice[];
  historyComplete: boolean;
  pagesFetched: number;
  total?: number;
}
export interface CancelPagarmeSubscriptionParams {
  subscriptionId: string;
  cancelPendingInvoices?: boolean;
  idempotencyKey?: string;
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

export async function cancelPagarmeSubscription({
  subscriptionId,
  cancelPendingInvoices = true,
  idempotencyKey,
}: CancelPagarmeSubscriptionParams) {
  if (!subscriptionId.startsWith("sub_")) {
    throw new Error(
      "ID da assinatura Pagar.me inválido."
    );
  }

  const headers: HeadersInit = {};

  if (idempotencyKey) {
    headers["Idempotency-Key"] =
      idempotencyKey;
  }

  return fetchPagarme<PagarmeSubscription>(
    `/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        cancel_pending_invoices:
          cancelPendingInvoices,
      }),
    }
  );
}
export interface GetPagarmeSubscriptionParams {
  subscriptionId: string;
}

export async function getPagarmeSubscription({
  subscriptionId,
}: GetPagarmeSubscriptionParams) {
  if (!subscriptionId.startsWith("sub_")) {
    throw new Error(
      "ID da assinatura Pagar.me inválido."
    );
  }

  return fetchPagarme<PagarmeSubscription>(
    `/subscriptions/${subscriptionId}`,
    {
      method: "GET",
    }
  );
}

export async function listPagarmeInvoices({
  subscriptionId,
  page = 1,
  size = 20,
}: ListPagarmeInvoicesParams) {
  if (!subscriptionId.startsWith("sub_")) {
    throw new Error("ID da assinatura Pagar.me inválido.");
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Página de faturas inválida.");
  }

  if (!Number.isInteger(size) || size < 1 || size > 100) {
    throw new Error("Tamanho da página de faturas inválido.");
  }

  const searchParams = new URLSearchParams({
    subscription_id: subscriptionId,
    page: String(page),
    size: String(size),
  });

  return fetchPagarme<PagarmePaginatedResponse<PagarmeInvoice>>(
    `/invoices?${searchParams.toString()}`,
    { method: "GET" }
  );
}

export async function listPagarmeSubscriptionInvoices({
  subscriptionId,
  pageSize = 20,
  maxPages = 3,
}: ListPagarmeSubscriptionInvoicesParams): Promise<PagarmeInvoiceHistory> {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 10) {
    throw new Error("Limite de páginas de faturas inválido.");
  }

  const invoices: PagarmeInvoice[] = [];
  let pagesFetched = 0;
  let total: number | undefined;

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await listPagarmeInvoices({
      subscriptionId,
      page,
      size: pageSize,
    });

    invoices.push(...response.data);
    pagesFetched = page;

    total = response.paging?.total ?? total;
    const uniqueInvoiceCount = new Set(invoices.map((invoice) => invoice.id)).size;
    const reachedTotal = typeof total === "number" && uniqueInvoiceCount >= total;
    const reachedLastPage = response.data.length < pageSize;

    if (reachedLastPage || reachedTotal) {
      return {
        invoices,
        historyComplete:
          reachedTotal || (typeof total !== "number" && reachedLastPage),
        pagesFetched,
        total,
      };
    }
  }

  return {
    invoices,
    historyComplete:
      typeof total === "number" &&
      new Set(invoices.map((invoice) => invoice.id)).size >= total,
    pagesFetched,
    total,
  };
}

export interface CreatePagarmeOrderParams {
  code: string;
  customerId: string;
  cardId: string;

  amount: number;
  itemCode: string;
  itemDescription: string;

  statementDescriptor?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PagarmeChargeTransaction {
  id?: string;
  status?: string;
  success?: boolean;
}

export interface PagarmeCharge {
  id: string;
  code?: string;
  status: string;
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  paid_at?: string;
  created_at?: string;
  last_transaction?: PagarmeChargeTransaction;
}

export interface PagarmeOrder {
  id: string;
  code?: string;
  status: string;
  amount: number;
  closed?: boolean;
  created_at?: string;
  updated_at?: string;
  charges?: PagarmeCharge[];
  metadata?: Record<string, string>;
}

export async function createPagarmeOrder({
  code,
  customerId,
  cardId,
  amount,
  itemCode,
  itemDescription,
  statementDescriptor = "REDACAO1000",
  metadata,
  idempotencyKey,
}: CreatePagarmeOrderParams) {
  if (!customerId.startsWith("cus_")) {
    throw new Error(
      "ID do cliente Pagar.me inválido."
    );
  }

  if (!cardId.startsWith("card_")) {
    throw new Error(
      "ID do cartão Pagar.me inválido."
    );
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "O valor da cobrança precisa ser um número inteiro positivo em centavos."
    );
  }

  const headers: HeadersInit = {};

  if (idempotencyKey) {
    headers["Idempotency-Key"] =
      idempotencyKey;
  }

  const payload = {
    code,

    items: [
      {
        code: itemCode,
        description: itemDescription,
        amount,
        quantity: 1,
      },
    ],

    customer_id: customerId,

    payments: [
      {
        payment_method: "credit_card",

        credit_card: {
          installments: 1,
          statement_descriptor:
            statementDescriptor,
          card_id: cardId,
        },
      },
    ],

    closed: true,
    metadata,
  };

  return fetchPagarme<PagarmeOrder>(
    "/orders",
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );
}

export interface PagarmePricingScheme {
  scheme_type: string;
  price?: number;
  minimum_price?: number;
  package_size?: number;
}

export interface PagarmeSubscriptionItem {
  id: string;
  name?: string;
  description?: string;
  quantity: number;
  status: string;
  cycles?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  pricing_scheme: PagarmePricingScheme;
}

export interface PagarmePaginatedResponse<TData> {
  data: TData[];
  paging?: {
    total?: number;
    previous?: string;
    next?: string;
  };
}

export interface ListPagarmeSubscriptionItemsParams {
  subscriptionId: string;
}

export async function listPagarmeSubscriptionItems({
  subscriptionId,
}: ListPagarmeSubscriptionItemsParams) {
  if (!subscriptionId.startsWith("sub_")) {
    throw new Error(
      "ID da assinatura Pagar.me inválido."
    );
  }

  return fetchPagarme<
    PagarmePaginatedResponse<PagarmeSubscriptionItem>
  >(
    `/subscriptions/${subscriptionId}/items?status=active&size=100`,
    {
      method: "GET",
    }
  );
}

export interface UpdatePagarmeSubscriptionItemParams {
  subscriptionId: string;
  itemId: string;

  name: string;
  description: string;

  price: number;
  quantity?: number;

  status?: "active" | "inactive";
}

export async function updatePagarmeSubscriptionItem({
  subscriptionId,
  itemId,
  name,
  description,
  price,
  quantity = 1,
  status = "active",
}: UpdatePagarmeSubscriptionItemParams) {
  if (!subscriptionId.startsWith("sub_")) {
    throw new Error(
      "ID da assinatura Pagar.me inválido."
    );
  }

  if (!itemId.startsWith("si_")) {
    throw new Error(
      "ID do item da assinatura Pagar.me inválido."
    );
  }

  if (!Number.isInteger(price) || price <= 0) {
    throw new Error(
      "O preço precisa ser um número inteiro positivo em centavos."
    );
  }

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "A quantidade precisa ser um número inteiro positivo."
    );
  }

  return fetchPagarme<PagarmeSubscriptionItem>(
    `/subscriptions/${subscriptionId}/items/${itemId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
        quantity,
        status,

        pricing_scheme: {
          scheme_type: "unit",
          price,
        },
      }),
    }
  );
}

export interface PagarmeOrderPaymentResult {
  isPaid: boolean;
  status: string;
  chargeId: string | null;
  paidAt: string | null;
}

export function getPagarmeOrderPaymentResult(
  order: PagarmeOrder
): PagarmeOrderPaymentResult {
  const charge =
    order.charges?.[0] ?? null;

  const status =
    charge?.status ??
    order.status ??
    "failed";

  const isPaid =
    order.status === "paid" &&
    charge?.status === "paid";

  return {
    isPaid,
    status,
    chargeId: charge?.id ?? null,
    paidAt: isPaid
      ? charge?.paid_at ?? new Date().toISOString()
      : null,
  };
}

export interface FindPagarmeOrderByCodeParams {
  code: string;
}

export async function findPagarmeOrderByCode({
  code,
}: FindPagarmeOrderByCodeParams) {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    throw new Error(
      "O código do pedido é obrigatório."
    );
  }

  const searchParams = new URLSearchParams({
    code: normalizedCode,
    page: "1",
    size: "1",
  });

  const response = await fetchPagarme<
    PagarmePaginatedResponse<PagarmeOrder>
  >(`/orders?${searchParams.toString()}`, {
    method: "GET",
  });

  return response.data[0] ?? null;
}

export interface PagarmeWebhook<TData = unknown> {
  id: string;
  event: string;
  status: "pending" | "sent" | "failed";
  data: TData;
}

export async function getPagarmeWebhook<
  TData
>({
  webhookId,
}: {
  webhookId: string;
}): Promise<PagarmeWebhook<TData>> {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <=
      WEBHOOK_LOOKUP_RETRY_DELAYS_MS.length;
    attempt += 1
  ) {
    try {
      return await fetchPagarme<
        PagarmeWebhook<TData>
      >(`/hooks/${webhookId}`, {
        method: "GET",
      });
    } catch (error) {
      lastError = error;

      const retryDelay =
        WEBHOOK_LOOKUP_RETRY_DELAYS_MS[
          attempt
        ];

      if (
        retryDelay === undefined ||
        !isRetryableWebhookLookupError(
          error
        )
      ) {
        throw error;
      }

      console.warn(
        "[PAGARME_WEBHOOK_LOOKUP_RETRY]",
        {
          webhookId,
          failedAttempt:
            attempt + 1,
          nextAttempt:
            attempt + 2,
          retryDelay,
        }
      );

      await sleep(retryDelay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Não foi possível consultar o webhook."
      );
}
