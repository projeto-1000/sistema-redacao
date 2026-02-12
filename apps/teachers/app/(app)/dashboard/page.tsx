import { formatDate } from "@repo/utils";
import { ArrowRight, Calendar, CheckCircle2, Clock, History, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const MOCK_ESSAYS = [
  {
    id: 1,
    student: "Ana Beatriz Lima",
    topic: "Desafios da Educação Inclusiva no Brasil Contemporâneo",
    deadline: "12h",
    status: "urgent",
    statusLabel: "URGENTE"
  },
  {
    id: 2,
    student: "João Oliveira",
    topic: "Impactos da Inteligência Artificial no Mercado de Trabalho",
    deadline: "21h",
    status: "warning",
    statusLabel: "ATENÇÃO"
  },
  {
    id: 3,
    student: "Mariana Santos",
    topic: "A Crise Hídrica e suas Consequências Socioeconômicas",
    deadline: "2d",
    status: "normal",
    statusLabel: "EM DIA"
  },
];

// Objeto auxiliar para mapear cores baseadas no status
const STATUS_STYLES = {
  urgent: {
    border: "border-l-red-500",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    timeText: "text-red-500"
  },
  warning: {
    border: "border-l-amber-400",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    timeText: "text-amber-400"
  },
  normal: {
    border: "border-l-blue-500",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    timeText: "text-blue-600"
  }
};

export default async function DashboardPage() {
  const date = formatDate(new Date(), 'full')

  return (
    <div className="space-y-8 px-4 md:px-10 lg:px-12 py-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, Professor(a)!
        </h1>
        <div className="flex items-center gap-2 text-slate-500 mt-1">
          <Calendar className="size-4" />
          <span className="capitalize">{date}</span>
        </div>
      </div>

      {/* Grid de Estatísticas
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        Card: Redações Pendentes
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Redações Pendentes</p>
              <h2 className="text-4xl font-bold text-primary">28</h2>
              <p className="text-xs text-primary mt-2 font-medium">+5 desde ontem</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl">
              <Clock className="size-6 text-amber-500" />
            </div>
          </div>
        </div>

        Card: Corrigidas Hoje/Semana
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Corrigidas hoje/semana</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-blue-600">12</h2>
                <span className="text-xl text-slate-300 font-bold">/ 45</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl">
              <CheckCircle2 className="size-6 text-blue-600" />
            </div>
          </div>
          Barra de Progresso
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-[26%] rounded-full" />
          </div>
        </div>
      </div> */}

      {/* Ações Rápidas */}
      {/* <div> */}
      {/* <h3 className="font-bold text-slate-800 text-lg mb-4">Ações Rápidas</h3> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Botão Gigante: Ver Pendentes (Laranja) */}
        <Link href="/redacoes-pendentes" className="block group">
          <div className="bg-primary hover:bg-primary/90 transition-all p-6 rounded-3xl relative overflow-hidden h-32 flex flex-col justify-between shadow-lg shadow-amber-200">
            <div className="relative z-10">
              <div className="bg-white/20 w-fit p-1.5 rounded-full mb-2">
                <MoreHorizontal className="text-white size-5" />
              </div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                Ver Pendentes
              </h3>
              <p className="text-amber-100 text-sm mt-1">Continuar de onde parou</p>
            </div>
            {/* Ícone: Removido rotate, adicionado centralização vertical */}
            <Clock className="absolute right-2 top-1/2 -translate-y-1/2 size-28 text-white opacity-15 group-hover:scale-105 transition-transform" />
          </div>
        </Link>

        {/* Botão Gigante: Ver Histórico (Azul) */}
        <Link href="/redacoes-corrigidas" className="block group">
          <div className="bg-secondary hover:bg-secondary/90 transition-all p-6 rounded-3xl relative overflow-hidden h-32 flex flex-col justify-between shadow-lg shadow-blue-200">
            <div className="relative z-10">
              <div className="bg-white/20 w-fit p-1.5 rounded-full mb-2">
                <CheckCircle2 className="text-white size-5" />
              </div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                Ver Histórico
              </h3>
              <p className="text-blue-100 text-sm mt-1">Revisar correções anteriores</p>
            </div>
            {/* Ícone: Removido rotate, adicionado centralização vertical */}
            <History className="absolute right-2 top-1/2 -translate-y-1/2 size-28 text-white opacity-15 group-hover:scale-105 transition-transform" />
          </div>
        </Link>
      </div>
      {/* </div> */}


      {/* Próximas Redações (NOVO LAYOUT EM GRID DE CARDS) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Próximas Redações</h3>
          <Link href="/redacoes-pendentes" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_ESSAYS.map((essay) => {
            const style = STATUS_STYLES[essay.status as keyof typeof STATUS_STYLES];

            return (
              <div
                key={essay.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow`}
              >
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      {essay.student.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>

                    {/* Nome e Badge */}
                    <div className="flex flex-col items-start gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${style.badgeBg} ${style.badgeText}`}>
                        {essay.statusLabel}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {essay.student}
                      </h4>
                    </div>
                  </div>

                  {/* Tempo Restante */}
                  <div className="text-right">
                    <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Restam</span>
                    <span className={`text-2xl font-bold leading-none ${style.timeText}`}>
                      {essay.deadline}
                    </span>
                  </div>
                </div>

                {/* Corpo do Card (Tema) */}
                <div className="mb-6 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tema da Redação
                  </p>
                  <p className="text-slate-700 font-medium text-sm leading-relaxed line-clamp-3">
                    {essay.topic}
                  </p>
                </div>

                {/* Botão de Ação */}
                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors text-sm group">
                  Corrigir Agora
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div >
  );
}