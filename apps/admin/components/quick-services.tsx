import { ChevronRight, FileEdit, FilePlus, Settings, Users } from "lucide-react";
import Link from "next/link";

export default function QuickServices() {
  const services = [
    {
      title: "Gerenciar alunos",
      description: "Adicionar ou editar perfils",
      icon: Users,
      colors: "colors-blue-50 text-primary",
      href: "/alunos",
    },
    {
      title: "Configurar Planos",
      description: "Preços e recursos",
      icon: Settings,
      colors: "colors-amber-50 text-amber-600",
      href: "/planos",
    },
    {
      title: "Corrigir Redações",
      description: "Acessar fila de correção",
      icon: FileEdit,
      colors: "colors-emerald-50 text-emerald-600",
      href: "/redacoes-pendentes",
    },
    {
      title: "Cadastrar Novo Tema",
      description: "Adicionar proposta e textos",
      icon: FilePlus,
      colors: "bg-purple-50 text-purple-600",
      href: "/temas/novo-tema",
    },
  ];

  return (
    <div className="rounded-4xl border border-slate-100 bg-white p-8 shadow-sm">
      <h3 className="mb-6 text-lg font-bold">Acesso Rápido</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map(({ title, description, href, icon: Icon, colors }) => (
          <Link
            key={title}
            href={href}
            prefetch={false}
            className="group flex items-center justify-between rounded-2xl border border-slate-100 p-4 text-left transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Icon className={`size-10 rounded-full p-2.5 ${colors}`} />
              <div>
                <h4 className="text-sm font-bold">{title}</h4>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-slate-300 transition-colors group-hover:text-slate-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
