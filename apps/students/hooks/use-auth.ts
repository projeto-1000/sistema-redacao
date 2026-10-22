import { registerStudent } from "@/app/actions/register-student";
import { captureRegistrationAttribution } from "@repo/utils/registration-tracking";
import { useState } from "react";
import { createClient } from "@/lib/client";
import { ForgotPasswordSchema, LoginSchema, RegisterSchema } from "@repo/validators";
import { useRouter } from "next/navigation";
import { trackCompleteRegistration } from "@/lib/meta-pixel";

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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
    } catch (err) {
      console.error("Erro em requestPasswordReset:", err);

      return {
        success: false,
        error: "Erro interno no servidor.",
      };
    }
  };

  const register = async (data: RegisterSchema) => {
    setIsRegistering(true);
    try {
      const result = await registerStudent(data, captureRegistrationAttribution());
      trackCompleteRegistration(result.eventId);
      router.refresh();
      router.replace(result.redirectTo);
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    login,
    authError,
    register,
    forgotPassword,
    isLoggingIn,
    isRegistering,
  };
}
