import { PasswordSetupForm } from "@/components/password-setup-form";
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
    <main className="bg-gradient-soft flex min-h-dvh items-center justify-center p-4">
      {validToken ? (
        <PasswordSetupForm token={validToken} />
      ) : (
        <div className="w-full max-w-[500px] rounded-xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Link inválido</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Inicie o cadastro novamente para receber um novo link.
          </p>
          <Link
            href="/login"
            className="text-primary mt-6 inline-flex font-semibold hover:underline"
          >
            Ir para o login
          </Link>
        </div>
      )}
    </main>
  );
}
