import { AuthError } from "@supabase/supabase-js";

const AUTH_ERROR_DICTIONARY: Record<string, string> = {
  same_password: "A nova senha deve ser diferente da senha atual.",
  weak_password: "Esta senha é muito fraca. Escolha uma combinação mais segura.",
  session_expired: "Sua sessão expirou. Faça login novamente para continuar.",
  session_not_found: "Sessão inválida. Faça login novamente.",
  reauthentication_needed:
    "Por motivos de segurança, você precisa fazer login novamente para alterar a senha.",
  over_request_rate_limit:
    "Muitas tentativas simultâneas. Aguarde alguns minutos e tente novamente.",
  validation_failed: "Os dados fornecidos estão em um formato inválido.",
};

export function getFriendlyErrorMessage(error: AuthError): string {
  const codeMatch = error?.code ? AUTH_ERROR_DICTIONARY[error.code] : undefined;
  if (codeMatch) return codeMatch;

  const isSessionError =
    error?.message?.includes("expired") || error?.message?.includes("session missing");
  if (isSessionError) return "O link expirou ou sua sessão é inválida. Faça login novamente.";

  return "Não foi possível atualizar a senha. Tente novamente mais tarde.";
}
