const PAGARME_API_URL = "https://api.pagar.me/core/v5";
const SECRET_KEY = process.env.PAGARME_SECRET_KEY;

export async function fetchPagarme(endpoint: string, options: RequestInit = {}) {
  if (!SECRET_KEY) {
    throw new Error("CRITICAL_ERROR: Chave secreta do Pagar.me não encontrada.");
  }

const encodedCredentials = Buffer.from(`${SECRET_KEY}:`).toString("base64");

  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${encodedCredentials}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("[PAGARME_API_ERROR]", errorData);
    throw new Error(`Falha na requisição ao Pagar.me: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export interface CreateCustomerParams {
  id: string; 
  name: string;
  email: string;
  document: string;
}

export async function createPagarmeCustomer({ id, name, email, document }: CreateCustomerParams) {
  const payload = {
    name,
    email,
    code: id, 
    type: "individual",
    document: document.replace(/\D/g, ""),
    document_type: "CPF",
  };

  const customer = await fetchPagarme("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return customer; 
}