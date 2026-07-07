export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "") 
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d{1,2})/, "$1-$2") 
    .slice(0, 14); 
};

export const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "") 
    .replace(/(\d{2})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d)/, "$1/$2") 
    .replace(/(\d{4})(\d{1,2})/, "$1-$2") 
    .slice(0, 18); 
};

export const formatDocument = (value: string) => {
  const v = value.replace(/\D/g, "");

  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  }

  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2")
    .slice(0, 18);
};

export const maskPixKey = (value: string, type: string) => {
  if (type === "cpf") {
    return value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").slice(0, 14);
  }
  if (type === "cnpj") {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})/, "$1-$2").slice(0, 18);
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