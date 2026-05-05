import { useState } from "react";
import { createClient } from "@/lib/client";
import { LoginSchema, RegisterSchema } from "@repo/validators";
import { useRouter } from "next/navigation";

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (data: LoginSchema) => {
    try {
      setIsLoggingIn(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      router.refresh();
      router.push("/inicio");
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (data: RegisterSchema) => {
    const cleanDocument = data.document ? data.document.replace(/\D/g, "") : null;
    const cleanPhone = data.phone ? data.phone.replace(/\D/g, "") : null;
    const termsAcceptedAt = data.terms ? new Date().toISOString() : null;

    //TODO: colcoar documento obrigatório pra todos e remover isso aqui
    if (cleanDocument) {
      const { error: rpcError } = await supabase.rpc("check_document_exists", {
        document: cleanDocument,
      });

      if (rpcError) {
        throw new Error("Document already registered");
      }
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          role: data.role,
          document: cleanDocument,
          phone: cleanPhone,
          terms_accepted_at: termsAcceptedAt,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    router.refresh();
    router.push("/inicio");
  };

  return {
    login,
    authError,
    register,
    isLoggingIn,
  };
}
