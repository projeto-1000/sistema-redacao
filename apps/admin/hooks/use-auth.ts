import { useState } from "react";
import { createClient } from "@/lib/client";
import { LoginSchema } from "@repo/validators";
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

  return {
    login,
    authError,
    isLoggingIn,
  };
}
