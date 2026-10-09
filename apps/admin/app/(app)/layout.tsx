"use client";

import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@repo/ui/components/header";
import { Footer } from "@repo/ui/components/footer";
import { useEffect, useState } from "react";

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
    { label: "Início", href: "/inicio" },
    { label: "Redações Pendentes", href: "/redacoes-pendentes" },
    { label: "Redações Corrigidas", href: "/redacoes-corrigidas" },
    { label: 'Alunos', href: '/alunos' },
    { label: 'Professores', href: '/professores' },
    { label: 'Temas', href: '/temas' },
    { label: 'Planos', href: '/planos' },
    { label: 'Créditos', href: '/creditos-extras' },
    { label: 'Cancelamentos', href: '/cancelamentos' },
    { label: "Campanhas", href: "/campanhas" },
    { label: "Meu perfil", href: "/perfil" },
  ];

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

  };

  return (
    <div className="min-h-dvh max-w-flex flex-col">
      <Header
        items={navItems}
        activePath={pathname.startsWith("/campanhas") ? "/campanhas" : pathname}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full p-6 md:p-8 bg-slate-50">
        {children}
      </main>

      <Footer />
    </div>
  );
}
