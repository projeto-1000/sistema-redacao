"use client";

import { useAuth } from "@/hooks/use-auth";
import { ForgotPasswordForm } from "@repo/ui/components/forgot-password-form";
import { Logo } from "@repo/ui/components/logo";
import { ForgotPasswordSchema } from "@repo/validators";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const handleForgotPassword = async (value: ForgotPasswordSchema) => {
    return forgotPassword(value);
  };

  return (
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <title>Esqueci Minha Senha - Projeto 1000</title>
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        <ForgotPasswordForm onSubmitAction={handleForgotPassword} backToLoginHref="/login" />
      </div>
    </main>
  );
}
