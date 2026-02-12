'use client'
import { useAuth } from "@/hooks/use-auth";
import { SignUpForm } from "@repo/ui/components/signup-form";
import type { RegisterSchema } from "@repo/validators";

export default function SignUpPage() {
  const { register, isRegistering } = useAuth();

  const handleRegister = async (values: RegisterSchema) => {
    await register(values);
  };
  return (
    <div className="bg-gradient-soft min-h-screen flex items-center justify-center p-4">
      <SignUpForm
        appType="teacher"
        onSubmit={handleRegister}
        isSubmitting={isRegistering}
      />
    </div>

  )
}