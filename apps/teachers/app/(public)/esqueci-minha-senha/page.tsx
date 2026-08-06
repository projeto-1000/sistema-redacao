"use client";

import { useAuth } from "@/hooks/use-auth";
import { ForgotPasswordForm } from "@repo/ui/components/forgot-password-form";
import { ForgotPasswordSchema } from "@repo/validators";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const handleForgotPassword = async (value: ForgotPasswordSchema) => {
    return forgotPassword(value);
  };

  return (
    <div className="bg-gradient-soft min-h-dvh flex items-center justify-center p-4">
      <title>Esqueci Minha Senha - Projeto 1000</title>
      <ForgotPasswordForm
        appType="teacher"
        onSubmitAction={handleForgotPassword}
        backToLoginHref="/login"
      />
    </div>
  );
}
