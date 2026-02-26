"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarCheck
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";

interface EssayData {
  id: string | number;
  student: string;
  topic: string;
  correctedDate: string;
  score: number;
}

export function FinishedEssays({ initialData }: { initialData: EssayData[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEssays = useMemo(() => {
    return initialData.filter((essay) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        essay.student.toLowerCase().includes(searchLower) ||
        essay.topic.toLowerCase().includes(searchLower)
      );
    });
  }, [searchTerm, initialData]);

  // Função auxiliar para definir a cor do texto da nota
  const getScoreColor = (score: number) => {
    if (score >= 900) return "text-green-600";
    if (score >= 700) return "text-blue-600";
    if (score >= 500) return "text-amber-500";
    return "text-red-600";
  };
  return (
    <div className="min-h-screen flex flex-col w-full">

      {/* --- BARRA DE BUSCA E FILTROS --- */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 text-red flex flex-col lg:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por aluno ou tema corrigido..."
            className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-400/50 placeholder:text-slate-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div className="flex w-full lg:w-auto gap-2 overflow-x-auto pb-2 lg:pb-0 px-2 lg:px-0">
          <button className="flex items-center gap-2 px-4 h-12 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap transition-colors border border-transparent hover:border-slate-200">
            <CalendarCheck className="size-4 text-slate-400" />
            Data de Correção
            <ChevronDown className="size-3 ml-1 text-slate-400" />
          </button>
        </div>
      </div>

      {filteredEssays.length > 0 ? (
        <>
          <div className="rounded-4xl bg-white border border-slate-200 overflow-hidden shadow-sm mt-8">

            {/* Header da Tabela */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Aluno
              </div>

              <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tema da Redação
              </div>
              <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Nota Final
              </div>

            </div>

            {/* Corpo da Tabela */}
            <div className="divide-y divide-slate-100">
              {filteredEssays.map((essay) => (
                <div
                  key={essay.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
                >

                  {/* Coluna 1: Aluno */}
                  <div className="lg:col-span-4 flex items-center gap-4">
                    <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                      {essay.student.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
                        {essay.student}
                      </h4>
                      <span className="text-xs text-slate-400">
                        Corrigida em {formatDate(essay.correctedDate, 'numeric')}
                      </span>
                    </div>
                  </div>

                  {/* Coluna 2: Tema */}

                  <div className="lg:col-span-4">
                    {/* <div className="lg:col-span-4 mt-2 lg:mt-0"> */}
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Tema
                    </span>
                    <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.topic}>
                      {essay.topic}
                    </p>
                  </div>

                  {/* Coluna 3: Nota (Estilo Tipográfico + Cores) */}
                  <div className="lg:col-span-2 flex items-baseline lg:justify-center gap-1">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-2">
                      Nota:
                    </span>
                    <span className={`text-xl font-black tracking-tight ${getScoreColor(essay.score)}`}>
                      {essay.score}
                    </span>
                    <span className="text-sm font-medium text-slate-400">
                      / 1000
                    </span>
                  </div>

                  {/* Coluna 4: Ação */}
                  <div className="lg:col-span-2 flex justify-end">
                    <Button
                      asChild
                      className="rounded-full font-bold shadow-sm h-9 whitespace-nowrap"
                    >
                      <Link href={`/redacoes-corrigidas/${essay.id}`}>
                        Ver Correção
                        <ArrowRight className="size-4 ml-1.5" />
                      </Link>
                    </Button>
                  </div>

                </div>
              ))}
            </div>

          </div>

          {/* TODO: Paginação */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <button className="size-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50">
              <ChevronLeft className="size-5" />
            </button>
            <button className="size-10 flex items-center justify-center rounded-full bg-[#EBC84C] font-bold">
              1
            </button>
            <button className="size-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500 mt-8">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <CalendarCheck className="size-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma correção finalizada"}
          </h3>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
            {searchTerm
              ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro aluno ou tema.`
              : "Você ainda não finalizou nenhuma correção."}
          </p>
        </div>
      )}
    </div>
  );
}