import "server-only";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";

export interface PagarmePlanItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  cycles?: number;
  status: "active" | "inactive" | "deleted";
  deleted_at?: string | null;
  pricing_scheme: {
    scheme_type: string;
    price?: number;
  };
}

export interface PagarmePlan {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "deleted";
  currency: string;
  interval: string;
  interval_count: number;
  minimum_price?: number;
  payment_methods?: string[];
  installments?: number[];
  billing_type?: string;
  metadata?: Record<string, string>;
  items: PagarmePlanItem[];
}

export interface PagarmePlanPayload {
  name: string;
  description?: string;
  status?: "active" | "inactive";
  payment_methods?: string[];
  installments?: number[];
  minimum_price: number;
  currency: string;
  interval: string;
  interval_count: number;
  billing_type?: string;
  metadata?: Record<string, string>;
}

interface CreatePagarmePlanPayload extends PagarmePlanPayload {
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    pricing_scheme: {
      scheme_type: "unit";
      price: number;
    };
  }>;
}

interface UpdatePagarmePlanItemPayload {
  name: string;
  description?: string;
  quantity: number;
  cycles?: number;
  status: "active" | "inactive";
  pricing_scheme: {
    scheme_type: "unit";
    price: number;
  };
}

export class PagarmePlanApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorData: unknown
  ) {
    super(message);
    this.name = "PagarmePlanApiError";
  }
}

async function fetchPagarmePlan<T>(endpoint: string, options: RequestInit = {}) {
  const secretKey = process.env.PAGARME_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAGARME_SECRET_KEY não configurada.");
  }

  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const rawResponse = await response.text();
  let responseData: unknown = null;

  if (rawResponse) {
    try {
      responseData = JSON.parse(rawResponse);
    } catch {
      responseData = rawResponse;
    }
  }

  if (!response.ok) {
    throw new PagarmePlanApiError(
      `Falha na requisição de plano à Pagar.me (${response.status}).`,
      response.status,
      responseData
    );
  }

  return responseData as T;
}

export function createPagarmePlan(payload: CreatePagarmePlanPayload) {
  return fetchPagarmePlan<PagarmePlan>("/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPagarmePlan(planId: string) {
  assertPagarmeId(planId, "plan_");

  return fetchPagarmePlan<PagarmePlan>(`/plans/${planId}`, {
    method: "GET",
  });
}

export function updatePagarmePlan(planId: string, payload: PagarmePlanPayload) {
  assertPagarmeId(planId, "plan_");

  return fetchPagarmePlan<PagarmePlan>(`/plans/${planId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updatePagarmePlanItem(
  planId: string,
  itemId: string,
  payload: UpdatePagarmePlanItemPayload
) {
  assertPagarmeId(planId, "plan_");
  assertPagarmeId(itemId, "pi_");

  return fetchPagarmePlan<PagarmePlanItem>(`/plans/${planId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

function assertPagarmeId(id: string, prefix: "plan_" | "pi_") {
  if (!id.startsWith(prefix)) {
    throw new Error(`ID da Pagar.me inválido: esperado prefixo ${prefix}.`);
  }
}
