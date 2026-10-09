"use client";

import { StudentOnboardingFlow } from "@/components/student-onboarding-flow";
import {
  StudentProfileProvider,
  useStudentProfile,
} from "./context/student-profile-context";
import { createClient } from "@/lib/client";
import { Header } from "@repo/ui/components/header";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV_ITEMS = [
  {
    label: "Início",
    href: "/inicio",
  },
  {
    label: "Temas",
    href: "/temas",
  },
  {
    label: "Minhas Redações",
    href: "/minhas-redacoes",
  },
  {
    label: "Meu perfil",
    href: "/perfil",
  },
];

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <StudentProfileProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </StudentProfileProvider>
  );
}

function AppLayoutContent({
  children,
}: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [supabase] = useState(() => createClient());

  const {
    profile,
    isAuthenticated,
    isLoading,
    error,
    retryProfile,
    markOnboardingCompleted,
  } = useStudentProfile();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        items={NAV_ITEMS}
        activePath={pathname}
        onLogout={handleLogout}
      />

      {!isLoading && profile && (
        <StudentOnboardingFlow
          initialOnboardingCompleted={
            profile.onboarding_completed
          }
          onOnboardingCompleted={
            markOnboardingCompleted
          }
        />
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-3 border-b border-red-200 bg-red-50 px-6 py-3 text-center text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            className="font-semibold underline underline-offset-4"
            onClick={() => void retryProfile()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <main className="flex-1 w-full bg-slate-50 p-6 md:p-8">
        {isAuthenticated !== true || isLoading ? (
          <div
            aria-label="Carregando perfil do aluno"
            className="mx-auto h-24 w-full max-w-6xl animate-pulse rounded-2xl bg-slate-200"
          />
        ) : error ? null : (
          children
        )}
      </main>
    </div>
  );
}
