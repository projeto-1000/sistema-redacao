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

export const formatPhone = (value: string) => {
  const v = value.replace(/\D/g, "");

  return v
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})/, "$1-$2")
    .slice(0, 15);
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