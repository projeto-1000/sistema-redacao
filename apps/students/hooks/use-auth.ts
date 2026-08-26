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
    const cleanDocument = data.document.replace(/\D/g, "");
    const cleanPhoneCountryCode = data.phoneCountryCode.replace(/\D/g, "") || "55";
    const cleanPhone = data.phone.replace(/\D/g, "");
    const termsAcceptedAt = data.terms ? new Date().toISOString() : null;

    const { data: documentExists, error: rpcError } = await supabase.rpc("check_document_exists", {
      doc_to_check: cleanDocument,
    });

    if (rpcError) {
      throw new Error("Não foi possível verificar o CPF no momento.");
    }

    if (documentExists === true) {
      throw new Error("Este CPF já está cadastrado.");
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          document: cleanDocument,
          phone_country_code: cleanPhoneCountryCode,
          phone: cleanPhone,
          terms_accepted_at: termsAcceptedAt,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user) {
      try {
        setIsRegistering(true);
        await fetch("/api/payments/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            record: {
              id: authData.user.id,
              full_name: data.name,
              email: data.email,
              document: cleanDocument,
              phone_country_code: cleanPhoneCountryCode,
              phone: cleanPhone,
            },
          }),
        });
      } catch (err) {
        console.error("🚨 Falha na comunicação com a API de pagamentos:", err);
      }
    }

    trackCompleteRegistration();
    router.refresh();
    router.replace("/inicio");
    setIsRegistering(false);
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
