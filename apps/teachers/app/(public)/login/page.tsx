"use client";

import { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@repo/ui/components/login-form";
import { Logo } from "@repo/ui/components/logo";
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
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        <Suspense
          fallback={<div className="h-[520px] w-full animate-pulse rounded-[28px] bg-white/60" />}
        >
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
