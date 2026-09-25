"use client";

import { useAuth } from "@/hooks/use-auth";
import { ForgotPasswordForm } from "@repo/ui/components/forgot-password-form";
import { Logo } from "@repo/ui/components/logo";
import { ForgotPasswordSchema } from "@repo/validators";
import { Suspense } from "react";

function ForgotPasswordContent() {
  const { forgotPassword } = useAuth();

  const handleForgotPassword = async (value: ForgotPasswordSchema) => {
    const result = await forgotPassword(value);
    return result;
  };

  return (
    <>
      <title>Esqueci Minha Senha - Projeto 1000</title>

      <ForgotPasswordForm onSubmitAction={handleForgotPassword} backToLoginHref="/login" />
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        <Suspense
          fallback={<div className="h-[440px] w-full animate-pulse rounded-[28px] bg-white/60" />}
        >
          <ForgotPasswordContent />
        </Suspense>
      </div>
    </main>
  );
}
