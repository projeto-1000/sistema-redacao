import { getHotmartMentorshipSignupData } from "@/lib/hotmart/mentorship-signup";
import { SignupPageClient } from "@/components/signup-page-client";
import type { Metadata } from "next";
import Link from "next/link";
import { formatCPF, formatPhone } from "@repo/utils";

export const metadata: Metadata = {
  title: "Cadastro - Projeto 1000",
};

interface SignupPageProps {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}

function SignupPageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-gradient-soft min-h-dvh flex items-center justify-center p-4">
      {children}
    </main>
  );
}

function SignupAccessMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="w-full max-w-[500px] rounded-xl border border-slate-100 bg-white p-8 text-center shadow-xl">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      <Link
        href="/login"
        className="mt-6 inline-flex font-semibold text-primary hover:underline"
      >
        Ir para o login
      </Link>
    </div>
  );
}

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;
  const rawToken = params.token;

  if (!rawToken) {
    return (
      <SignupPageContainer>
        <SignupPageClient
          context={{
            source: "ORGANIC",
          }}
        />
      </SignupPageContainer>
    );
  }

  if (Array.isArray(rawToken)) {
    return (
      <SignupPageContainer>
        <SignupAccessMessage
          title="Link inválido"
          description="O link de cadastro informado não é válido. Verifique o e-mail recebido ou entre em contato com o suporte."
        />
      </SignupPageContainer>
    );
  }

  const result = await getHotmartMentorshipSignupData(rawToken);

  if (result.status === "invalid_token") {
    return (
      <SignupPageContainer>
        <SignupAccessMessage
          title="Link inválido"
          description="Não encontramos um acesso válido para este link. Verifique o e-mail recebido ou entre em contato com o suporte."
        />
      </SignupPageContainer>
    );
  }

  if (result.status === "already_claimed") {
    return (
      <SignupPageContainer>
        <SignupAccessMessage
          title="Link já utilizado"
          description="Este acesso já foi vinculado a uma conta. Faça login para acessar a plataforma."
        />
      </SignupPageContainer>
    );
  }

  const mentorshipData = result.data;

  return (
    <SignupPageContainer>
      <SignupPageClient
        context={{
          source: "HOTMART_MENTORIA",
          token: rawToken,
          initialValues: {
            name: mentorshipData.buyerName ?? "",
            email: mentorshipData.buyerEmail,
            document: mentorshipData.buyerDocument
              ? formatCPF(mentorshipData.buyerDocument)
              : "",
            phoneCountryCode: mentorshipData.phoneCountryCode,
            phone: mentorshipData.phone
              ? formatPhone(mentorshipData.phone)
              : "",
          },
        }}
      />
    </SignupPageContainer>
  );
}