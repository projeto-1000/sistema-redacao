'use client'
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@repo/ui/components/login-form";
import type { LoginSchema } from "@repo/validators";

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const handleLogin = async (values: LoginSchema) => {
    await login(values);
  };

  return (
    <div className="bg-gradient-soft min-h-screen flex items-center justify-center p-4">
      <LoginForm
        appType="teacher"
        onSubmit={handleLogin}
        isSubmitting={isLoggingIn}
      />
    </div>

  )
}