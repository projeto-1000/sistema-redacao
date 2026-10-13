"use client";

import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@repo/ui/components/header";
import { Footer } from "@repo/ui/components/footer";
import { useEffect, useState } from "react";
import {
  Ban,
  BookOpen,
  CircleCheckBig,
  Coins,
  FileClock,
  GraduationCap,
  Home,
  Layers3,
  ListChecks,
  Megaphone,
  UserRound,
  Users,
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    { label: "Início", href: "/inicio", icon: Home, group: "Conteúdo" },
    {
      label: "Redações Pendentes",
      href: "/redacoes-pendentes",
      icon: FileClock,
      group: "Conteúdo",
    },
    {
      label: "Redações Corrigidas",
      href: "/redacoes-corrigidas",
      icon: CircleCheckBig,
      group: "Conteúdo",
    },
    { label: "Alunos", href: "/alunos", icon: Users, group: "Pessoas" },
    {
      label: "Professores",
      href: "/professores",
      icon: GraduationCap,
      group: "Pessoas",
    },
    {
      label: "Temas",
      href: "/temas",
      icon: BookOpen,
      group: "Conteúdo",
      desktopPlacement: "overflow" as const,
    },
    {
      label: "Planos",
      href: "/planos",
      icon: Layers3,
      group: "Financeiro",
      desktopPlacement: "overflow" as const,
    },
    {
      label: "Créditos",
      href: "/creditos-extras",
      icon: Coins,
      group: "Financeiro",
      desktopPlacement: "overflow" as const,
    },
    {
      label: "Cancelamentos",
      href: "/cancelamentos",
      icon: Ban,
      group: "Financeiro",
      desktopPlacement: "overflow" as const,
    },
    {
      label: "Atividades",
      href: "/atividades-administrativas",
      icon: ListChecks,
      group: "Administração",
    },
    {
      label: "Campanhas",
      href: "/campanhas",
      icon: Megaphone,
      group: "Administração",
      desktopPlacement: "overflow" as const,
    },
    {
      label: "Meu perfil",
      href: "/perfil",
      icon: UserRound,
      group: "Administração",
      desktopPlacement: "account" as const,
    },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  return (
    <div className="flex min-h-dvh max-w-full flex-col">
      <Header items={navItems} activePath={pathname} onLogout={handleLogout} collapseAt="xl" />

      <main className="w-full flex-1 bg-slate-50 p-6 md:p-8">{children}</main>

      <Footer />
    </div>
  );
}
