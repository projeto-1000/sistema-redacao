"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Star,
  List,
  ChevronDown,
  FileText
} from "lucide-react";
import { EssayCard } from "./essay-card";
import { Essay } from "@repo/types";

interface EssayListProps {
  initialEssays: Essay[];
}

export function EssayList({ initialEssays }: EssayListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEssays = useMemo(() => {
    return initialEssays.filter((essay) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        essay.title.toLowerCase().includes(searchLower) ||
        essay.thematic_axis.toLowerCase().includes(searchLower)
      );
    });
  }, [searchTerm, initialEssays]);

  return (
    <div className="flex flex-col w-full">
      {/* --- BARRA DE BUSCA E FILTROS --- */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar redação pelo título ou tema..."
            className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#EBC84C]/50 placeholder:text-slate-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros Visuais (Podem ser expandidos para funcionalidades reais de sort no futuro) */}
        <div className="flex w-full lg:w-auto gap-2 overflow-x-auto pb-2 lg:pb-0 px-2 lg:px-0">
          <button className="flex items-center gap-2 px-4 h-12 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap transition-colors border border-transparent hover:border-slate-200">
            <Calendar className="size-4 text-slate-400" />
            Data
            <ChevronDown className="size-3 ml-1 text-slate-400" />
          </button>

          <button className="flex items-center gap-2 px-4 h-12 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap transition-colors border border-transparent hover:border-slate-200">
            <Star className="size-4 text-slate-400" />
            Nota
            <ChevronDown className="size-3 ml-1 text-slate-400" />
          </button>

          <button className="flex items-center gap-2 px-4 h-12 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap transition-colors border border-transparent hover:border-slate-200">
            <List className="size-4 text-slate-400" />
            Tema
            <ChevronDown className="size-3 ml-1 text-slate-400" />
          </button>
        </div>
      </div>

      {/* --- GRID DE RESULTADOS --- */}
      {filteredEssays.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredEssays.map((essay) => {
            const isCorrected = essay.status === "corrected";

            if (isCorrected) {
              return (
                <Link
                  key={essay.id}
                  href={`/minhas-redacoes/${essay.id}`}
                  className="block h-full group"
                >
                  <EssayCard essay={essay} />
                </Link>
              );
            }

            return (
              <div
                key={essay.id}
                className="block h-full cursor-not-allowed opacity-90"
                title="Esta redação ainda está em processo de correção."
              >
                <EssayCard essay={essay} />
              </div>
            );
          })}
        </div>
      ) : (

        <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
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
              ? `Não encontramos nada para "${searchTerm}". Tente buscar por outro título ou eixo temático.`
              : "Você ainda não enviou nenhuma redação para correção."}
          </p>
        </div>
      )}
    </div>
  );
}