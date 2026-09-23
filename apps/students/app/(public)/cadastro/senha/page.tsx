import { PasswordSetupForm } from "@/components/password-setup-form";
import { AuthFormCard } from "@repo/ui/components/auth-form-card";
import { Logo } from "@repo/ui/components/logo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Definir senha - Projeto 1000",
};

interface PasswordSetupPageProps {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}

export default async function PasswordSetupPage({ searchParams }: PasswordSetupPageProps) {
  const { token } = await searchParams;
  const validToken = typeof token === "string" ? token : null;

  return (
    <main className="auth-page-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
        <Logo className="mb-8 h-20 sm:h-24" />
        {validToken ? (
          <PasswordSetupForm token={validToken} />
        ) : (
          <AuthFormCard
            title="Link inválido"
            description="Inicie o cadastro novamente para receber um novo link."
            footer={
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Ir para o login
              </Link>
            }
          />
        )}
      </div>
    </main>
  );
}
