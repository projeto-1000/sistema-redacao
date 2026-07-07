interface BrasilApiCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

interface BrasilApiCepAddress {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function getAddressByCep(
  cep: string,
  signal?: AbortSignal
): Promise<BrasilApiCepAddress> {
  const sanitizedCep = cep.replace(/\D/g, "");

  if (sanitizedCep.length !== 8) {
    throw new Error("Digite um CEP válido.");
  }

  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${sanitizedCep}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("CEP não encontrado.");
  }

  const data = (await response.json()) as BrasilApiCepResponse;

  return {
    zipCode: data.cep,
    street: data.street,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
  };
}
