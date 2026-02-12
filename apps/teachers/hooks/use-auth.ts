import { useState } from "react";
import { createClient } from "@/lib/client";
import { LoginSchema, RegisterSchema } from "@repo/validators";
import { useRouter } from "next/navigation";

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
      router.push("/dashboard");
    } catch (error: any) {
      console.log(`Erro ao entrar: ${error.message}`);
      throw new Error(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (data: RegisterSchema) => {
    try {
      setIsRegistering(true);

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
          },
        },
      });

      if (error) {
        throw error;
      }

      router.refresh();
      router.push("/dashboard");
    } catch (error: any) {
      console.log(`Erro ao criar conta: ${error.message}`);
      throw new Error(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    login,
    register,
    isLoggingIn,
    isRegistering,
  };
}
