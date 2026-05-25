interface AppError {
  title: string;
  description: string;
}

interface Error {
  title: string;
  description: string;
}

const DEFAULT_ERROR: AppError = {
  title: "Ops, algo deu errado",
  description: "Ocorreu um problema inesperado. Por favor, tente novamente mais tarde.",
};

 const APP_ERRORS: Record<string, AppError> = {
  "unauthorized_role": {
    title: "Acesso negado",
    description: "Você não tem permissão para acessar esta área.",
  },
  "Invalid login credentials": {
    title: "Login inválido",
    description: "E-mail e/ou senha incorretos. Verifique as informações e tente novamente.",
  },

  "default": DEFAULT_ERROR,
  "access_denied": {
    title: "Algo deu errado",
    description: "O link expirou ou já foio usado. Por favor, tente novamente.",
  }
};

export function getErrorContent(errorString: string | null): AppError | null {
  if (!errorString) return null;
  console.log(errorString)
  return APP_ERRORS[errorString] || DEFAULT_ERROR;
}


const authErrors: Record<string, Error> = {
  "User already registered": {
    title: "Conta já existente",
    description: "Este e-mail já está cadastrado em nossa plataforma. Tente fazer login."
  },
  "Password should be at least 6 characters": {
    title: "Senha muito curta",
    description: "A senha deve ter no mínimo 6 caracteres para a sua segurança."
  },
  "Invalid login credentials": {
    title: "Acesso negado",
    description: "E-mail ou senha incorretos. Verifique seus dados e tente novamente."
  },
  "Email not confirmed": {
    title: "E-mail não verificado",
    description: "Por favor, confirme seu e-mail acessando o link que enviamos para você."
  },
  "Too many requests. Please try again later.": {
    title: "Muitas tentativas",
    description: "Você tentou muitas vezes. Aguarde alguns minutos e tente de novo."
  },
  "Document already registered": {
    title: "Documento em uso",
    description: "O CPF informado já está vinculado a outra conta na plataforma."
  },
};

export function getErrorMessage(error: unknown): Error {
  const rawMessage = error instanceof Error ? error.message : String(error);

  return authErrors[rawMessage] || {
    title: "Erro inesperado",
    description: "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde."
  };
}