"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { Button } from "@repo/ui/components/button";

type EssayType = {
  id: string;
  student: string;
  topic: string;
  submissionDate: string;
  deadline: string;
  status: "urgent" | "warning" | "normal";
  deadlineLabel: string;
};

interface PendingEssaysClientProps {
  initialEssays: EssayType[];
}

export function PendingEssaysClient({ initialEssays }: PendingEssaysClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEssays = useMemo(() => {
    return initialEssays.filter((essay) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        essay.student.toLowerCase().includes(searchLower) ||
        essay.topic.toLowerCase().includes(searchLower)
      );
    });
  }, [searchTerm, initialEssays]);

  const renderStatusBadge = (status: string, text: string, label: string) => {
    let classes = "border-blue-500 text-blue-700 bg-blue-100"; // Default (Normal)

    if (status === 'urgent') {
      classes = "border-red-500 text-red-700 bg-red-100";
    } else if (status === 'warning') {
      classes = "border-amber-400 text-amber-700 bg-amber-100";
    }

    return (
      <div className={`
        inline-flex px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border tracking-wide 
        whitespace-nowrap items-center justify-center gap-1.5 ${classes}
      `} title={label}>
        <Clock className="size-3" />
        {text}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col w-full p-4 md:p-8">

      {/* --- BARRA DE BUSCA E FILTROS --- */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por aluno ou tema..."
            className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-amber-400/50 placeholder:text-slate-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div className="flex w-full lg:w-auto gap-2 overflow-x-auto pb-2 lg:pb-0 px-2 lg:px-0">
          <button className="flex items-center gap-2 px-4 h-12 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap transition-colors border border-transparent hover:border-slate-200">
            <Clock className="size-4 text-slate-400" />
            Prazo
            <ChevronDown className="size-3 ml-1 text-slate-400" />
          </button>
        </div>
      </div>

      {filteredEssays.length > 0 ? (
        <>
          <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm mt-8 bg-white">
            {/* Header da Tabela */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Aluno
              </div>
              <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tema da Redação
              </div>
              <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Prazo
              </div>
              <div className="col-span-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ação
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
                      {essay.student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
                        {essay.student}
                      </h4>
                      <span className="text-xs text-slate-400 ">
                        Enviado em {essay.submissionDate}
                      </span>
                    </div>
                  </div>

                  {/* Coluna 2: Tema */}
                  <div className="lg:col-span-5 mt-2 lg:mt-0">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Tema
                    </span>
                    <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.topic}>
                      {essay.topic}
                    </p>
                  </div>

                  {/* Coluna 3: Prazo (Badge) */}
                  <div className="lg:col-span-2 flex lg:justify-center">
                    {renderStatusBadge(essay.status, essay.deadline, essay.deadlineLabel)}
                  </div>

                  {/* Coluna 4: Ação */}
                  <div className="lg:col-span-1 flex justify-end">
                    <Button
                      asChild
                      className="rounded-full font-bold shadow-sm h-9 whitespace-nowrap transition-transform"
                    >
                      {/* Ajustei o link para bater com a rota que usamos na dashboard */}
                      <Link href={`/corrigir-redacao/${essay.id}`}>
                        Corrigir
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
            <button className="size-10 flex items-center justify-center rounded-full bg-[#EBC84C] font-bold text-slate-900">
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
            {searchTerm ? (
              <Search className="size-8 text-slate-300" />
            ) : (
              <FileText className="size-8 text-slate-300" />
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma redação por aqui"}
          </h3>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
            {searchTerm
              ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro aluno ou tema.`
              : "Ainda não há nenhuma redação para correção no momento. Bom trabalho!"}
          </p>
        </div>
      )}
    </div>
  );
}