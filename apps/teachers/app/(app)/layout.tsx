"use client";

import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@repo/ui/components/header";
import { useEffect, useState } from "react";
import { CircleCheckBig, FileClock, Home, UserRound } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const navItems = [
    { label: "Início", href: "/inicio", icon: Home, group: "Área do professor" },
    {
      label: "Redações Pendentes",
      href: "/redacoes-pendentes",
      icon: FileClock,
      group: "Área do professor",
    },
    {
      label: "Redações Corrigidas",
      href: "/redacoes-corrigidas",
      icon: CircleCheckBig,
      group: "Área do professor",
    },
    {
      label: "Meu perfil",
      href: "/perfil",
      icon: UserRound,
      group: "Conta",
      desktopPlacement: "account" as const,
    },
  ];

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        items={navItems}
        activePath={pathname}
        onLogout={handleLogout}
        collapseAt="lg"
      />
      <main className="flex-1 w-full p-6 md:p-8 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
