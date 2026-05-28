'use client'

import { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@repo/ui/components/login-form";
import type { LoginSchema } from "@repo/validators";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const { login, isLoggingIn, authError } = useAuth();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const error = urlError || authError;

  const handleLogin = async (values: LoginSchema) => {
    await login(values);
  };

  return (
    <>
      <title>Login - Projeto 1000</title>

      <LoginForm
        appType="teacher"
        onSubmit={handleLogin}
        isSubmitting={isLoggingIn}
        error={error}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-gradient-soft min-h-dvh flex items-center justify-center p-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  )
}