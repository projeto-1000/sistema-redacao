import { ChevronRight, FileEdit, FilePlus, Settings, Users } from "lucide-react";

export default function QuickServices() {
  return (
    <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Acesso Rápido</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <button className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Gerenciar Alunos</h4>
              <p className="text-xs text-slate-500 mt-0.5">Adicionar ou editar perfis</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>

        <button className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Settings className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Configurar Planos</h4>
              <p className="text-xs text-slate-500 mt-0.5">Preços e recursos</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>

        <button className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileEdit className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Corrigir Redações</h4>
              <p className="text-xs text-slate-500 mt-0.5">Acessar fila de correção</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>

        <button className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FilePlus className="size-5" />

            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Cadastrar Novo Tema</h4>
              <p className="text-xs text-slate-500 mt-0.5">Adicionar proposta e textos</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>

      </div>
    </div>
  )
}