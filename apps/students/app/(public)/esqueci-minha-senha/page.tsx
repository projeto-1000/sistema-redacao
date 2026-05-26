'use client'

import { useAuth } from "@/hooks/use-auth";
import { ForgotPasswordForm } from "@repo/ui/components/forgot-password-form";
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

      <ForgotPasswordForm
        appType="student"
        onSubmitAction={handleForgotPassword}
        backToLoginHref="/login"
      />
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="bg-gradient-soft min-h-dvh flex items-center justify-center p-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  )
}