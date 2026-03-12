import { ChevronRight, FileEdit, FilePlus, Settings, Users } from "lucide-react";
import Link from "next/link";

export default function QuickServices() {

  const services = [
    { title: 'Gerenciar alunos', description: 'Adicionar ou editar perfils', icon: Users, colors: 'colors-blue-50 text-secondary', href: '/alunos' },
    { title: 'Configurar Planos', description: 'Preços e recursos', icon: Settings, colors: 'colors-amber-50 text-amber-600', href: '/' },
    { title: 'Corrigir Redações', description: 'Acessar fila de correção', icon: FileEdit, colors: 'colors-emerald-50 text-emerald-600', href: '/redacoes-pendentes' },
    { title: 'Cadastrar Novo Tema', description: 'Adicionar proposta e textos', icon: FilePlus, colors: 'bg-purple-50 text-purple-600', href: '/temas/novo-tema' },
  ]


  return (
    <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Acesso Rápido</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {services.map(({ title, description, href, icon: Icon, colors }) => (
          <Link key={title} href={href} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group">
            <div className="flex items-center gap-4">
              <Icon className={`size-10 rounded-full p-2.5 ${colors}`} />
              <div>
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}

      </div>
    </div>
  )
}