import {
  Plus,
  Search,
  ChevronDown,
  Pencil,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";

// Mocks baseados no Figma
const teachersData = [
  { id: "1", initials: "RS", name: "Roberto Silva", email: "roberto@projeto1000.com", status: "Ativo", currentMonth: 42, total: 154, avatarBg: "bg-blue-50 text-blue-600" },
  { id: "2", initials: "AP", name: "Ana Paula Souza", email: "ana.paula@projeto1000.com", status: "Ativo", currentMonth: 18, total: 89, avatarBg: "bg-pink-50 text-pink-600" },
  { id: "3", initials: "CM", name: "Carlos Mendes", email: "carlos.m@projeto1000.com", status: "Inativo", currentMonth: 0, total: 12, avatarBg: "bg-orange-50 text-orange-600" },
  { id: "4", initials: "MC", name: "Mariana Costa", email: "mariana.c@projeto1000.com", status: "Ativo", currentMonth: 56, total: 230, avatarBg: "bg-purple-50 text-purple-600" },
  { id: "5", initials: "JP", name: "João Pedro Alves", email: "joao.pedro@projeto1000.com", status: "Pendente", currentMonth: 0, total: 0, avatarBg: "bg-amber-50 text-amber-600" },
];

export default function TeachersManagementPage() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
        <div className="max-w-[1200px] mx-auto space-y-8">

          {/* =========================================
              CABEÇALHO DA PÁGINA
          ========================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Professores</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Gerencie o acesso e desempenho da sua equipe docente.
              </p>
            </div>
            {/* Mantido no azul padrão do painel, substituindo o amarelo do design */}
            <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full h-11 px-6 shadow-sm w-full sm:w-auto">
              <Plus className="size-4 mr-2" />
              Adicionar Novo Professor
            </Button>
          </div>

          {/* =========================================
              FILTROS E BUSCA
          ========================================= */}
          <div className="flex flex-col md:flex-row items-center gap-4">

            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail"
                className="w-full h-12 pl-11 pr-4 rounded-[1rem] text-sm font-medium text-slate-700 bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <div className="w-full md:w-64 shrink-0 relative">
              <select className="w-full h-12 px-4 rounded-[1rem] border border-slate-200 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all bg-white appearance-none cursor-pointer shadow-sm">
                <option value="todos">Filtrar por Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="pendente">Pendentes</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>

          </div>

          {/* =========================================
              TABELA RESPONSIVA (CSS GRID)
          ========================================= */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">

            {/* Header Desktop */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-white">
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professor</div>
              <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
              <div className="col-span-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center">Corrigidas (Mês Atual)</div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Corrigidas (Total)</div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</div>
            </div>

            {/* Corpo / Lista */}
            <div className="divide-y divide-slate-100">
              {teachersData.map((teacher) => (
                <div key={teacher.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">

                  {/* Professor */}
                  <div className="col-span-1 lg:col-span-3 flex items-center gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${teacher.avatarBg}`}>
                      {teacher.initials}
                    </div>
                    <span className="font-bold text-sm text-blue-600 hover:underline cursor-pointer">{teacher.name}</span>
                  </div>

                  {/* E-mail */}
                  <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</span>
                    <span className="text-sm font-medium text-slate-500">{teacher.email}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${teacher.status === "Ativo" ? "bg-emerald-50 text-emerald-600" :
                        teacher.status === "Pendente" ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-500"
                      }`}>
                      {teacher.status}
                    </span>
                  </div>

                  {/* Corrigidas (Mês Atual) */}
                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mês Atual</span>
                    <span className="text-base font-black text-blue-600">{teacher.currentMonth}</span>
                  </div>

                  {/* Corrigidas (Total) */}
                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-base font-black text-slate-900">{teacher.total}</span>
                  </div>

                  {/* Ações */}
                  <div className="col-span-1 lg:col-span-1 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Pencil className="size-4.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                          <p>Editar Professor</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            {teacher.status === "Ativo" ? <Ban className="size-4.5" /> : <CheckCircle2 className="size-4.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                          <p>{teacher.status === "Ativo" ? "Bloquear Acesso" : "Desbloquear"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* =========================================
                PAGINAÇÃO
            ========================================= */}
            <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Mostrando 5 de 42 professores
              </span>

              <div className="flex items-center gap-1">
                <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                {/* Ativo também mudou pro azul padrão */}
                <button className="size-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-sm">
                  1
                </button>
                <button className="size-8 flex items-center justify-center rounded-full text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                  2
                </button>
                <button className="size-8 flex items-center justify-center rounded-full text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                  3
                </button>
                <span className="px-1 text-slate-400">...</span>
                <button className="size-8 flex items-center justify-center rounded-full text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                  9
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}