"use client";

import { StudentOnboardingFlow } from "@/components/student-onboarding-flow";
import {
  StudentProfileProvider,
  useStudentProfile,
} from "./context/student-profile-context";
import { createClient } from "@/lib/client";
import { Header } from "@repo/ui/components/header";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

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
    isLoading,
    error,
    markOnboardingCompleted,
  } = useStudentProfile();

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    router.replace("/login");
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
          className="border-b border-red-200 bg-red-50 px-6 py-3 text-center text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <main className="flex-1 w-full bg-slate-50 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}