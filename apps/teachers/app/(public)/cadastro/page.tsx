'use client'
import { useAuth } from "@/hooks/use-auth";
import { SignUpForm } from "@repo/ui/components/signup-form";
import type { RegisterSchema } from "@repo/validators";

export default function SignUpPage() {
  const { register } = useAuth();

  const handleRegister = async (values: RegisterSchema) => {
    await register(values);
  };
  return (
    <div className="bg-gradient-soft min-h-dvh flex items-center justify-center p-4">
      <title>Cadastro - Projeto 1000</title>

      <SignUpForm
        appType="teacher"
        onSubmit={handleRegister}
      />
    </div>

  )
}