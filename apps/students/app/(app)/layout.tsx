"use client";

import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@repo/ui/components/header";
import { Footer } from "@repo/ui/components/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const navItems = [
    { label: "Início", href: "/inicio" },
    { label: "Temas", href: "/temas" },
    { label: "Minhas Redações", href: "/minhas-redacoes" },
    { label: "Meu perfil", href: "/perfil" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen max-w-flex flex-col">
      <Header
        items={navItems}
        activePath={pathname}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full p-6 md:p-8 bg-slate-50">
        {children}
      </main>

      <Footer />
    </div>
  );
}