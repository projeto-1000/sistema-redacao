import { useState } from "react";
import { createClient } from "@/lib/client";
import { ForgotPasswordSchema, LoginSchema } from "@repo/validators";
import { useRouter } from "next/navigation";

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (data: LoginSchema) => {
    try {
      setIsLoggingIn(true);
      setAuthError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      router.replace("/inicio");
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível entrar.");
      setIsLoggingIn(false);
    }
  };

  const forgotPassword = async (data: ForgotPasswordSchema) => {
    const targetUrl = encodeURIComponent("/nova-senha?flow=reset");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${targetUrl}`,
      });

      if (error) {
        console.error("Erro no reset de senha:", error.message);

        return {
          success: false,
          error: "Não foi possível processar a solicitação no momento.",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Erro em requestPasswordReset:", error);

      return {
        success: false,
        error: "Erro interno no servidor.",
      };
    }
  };

  return {
    login,
    forgotPassword,
    authError,
    isLoggingIn,
  };
}
