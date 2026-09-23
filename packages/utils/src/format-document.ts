export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "") 
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d{1,2})/, "$1-$2") 
    .slice(0, 14); 
};

export const normalizeCNPJ = (value: string) => {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

export const formatCNPJ = (value: string) => {
  const cnpj = normalizeCNPJ(value).slice(0, 14);

  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;

  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
};

export const normalizeDocument = (value: string) => {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

export const formatDocument = (value: string) => {
  const normalized = normalizeDocument(value).slice(0, 14);

  if (/^\d*$/.test(normalized) && normalized.length <= 11) {
    return normalized
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  }

  return formatCNPJ(normalized);
};

export const maskPixKey = (value: string, type: string) => {
  if (type === "cpf") {
    return value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").slice(0, 14);
  }
  if (type === "cnpj") {
    return formatCNPJ(value);
  }
  if (type === "phone") {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})/, "$1-$2").slice(0, 15);
  }
  return value.trim(); 
};

export const onlyDigits = (value: string) => {
  return value.replace(/\D/g, "");
};

function calculateCPFVerificationDigit(base: string, initialWeight: number) {
  const sum = base
    .split("")
    .reduce(
      (accumulator, digit, index) =>
        accumulator + Number(digit) * (initialWeight - index),
      0
    );

  const rest = (sum * 10) % 11;

  return rest === 10 ? 0 : rest;
}

export const isValidCPF = (value: string) => {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const firstDigit = calculateCPFVerificationDigit(cpf.slice(0, 9), 10);
  const secondDigit = calculateCPFVerificationDigit(cpf.slice(0, 10), 11);

  return cpf.endsWith(`${firstDigit}${secondDigit}`);
};

export const isValidCNPJ = (value: string) => {
  const cnpj = normalizeCNPJ(value);

  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce(
        (total, character, index) =>
          total + (character.charCodeAt(0) - 48) * weights[index]!,
        0,
      );
    const remainder = sum % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
};
