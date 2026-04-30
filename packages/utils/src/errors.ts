interface AppError {
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
};

export function getErrorContent(errorString: string | null): AppError | null {
  if (!errorString) return null;
  
  return APP_ERRORS[errorString] || DEFAULT_ERROR;
}