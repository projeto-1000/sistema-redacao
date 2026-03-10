import {
  Plus,
  Search,
  ChevronDown,
  Filter,
  Calendar,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";

// Mocks baseados no Figma
const themesData = [
  {
    id: "#4829",
    title: "O impacto do descarte de resíduos eletrônicos na sociedade brasileira contemporânea",
    axis: "MEIO AMBIENTE",
    date: "12 Out, 2023",
    status: "Ativo"
  },
  {
    id: "#4828",
    title: "Caminhos para combater o estigma associado às doenças mentais no Brasil",
    axis: "SAÚDE",
    date: "08 Out, 2023",
    status: "Ativo"
  },
  {
    id: "#4827",
    title: "Os desafios para a formação educacional de surdos no Brasil",
    axis: "EDUCAÇÃO",
    date: "05 Out, 2023",
    status: "Ativo"
  },
  {
    id: "#4826",
    title: "A persistência da violência contra a mulher na sociedade brasileira",
    axis: "SOCIAL",
    date: "28 Set, 2023",
    status: "Rascunho"
  }
];

export default function ThemesCatalogPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1000px] mx-auto space-y-8">

        {/* =========================================
            CABEÇALHO
        ========================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo de Temas</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Padronização e organização do banco de temas ENEM.
            </p>
          </div>
          <Button asChild className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full h-11 px-6 shadow-sm w-full sm:w-auto">
            <Link href='/temas/novo-tema'>
              <Plus className="size-4 mr-2" />
              Adicionar Novo Tema
            </Link>
          </Button>
        </div>

        {/* =========================================
            BARRA DE BUSCA E FILTROS
        ========================================= */}
        <div className="flex flex-col md:flex-row items-center gap-3">

          {/* Input de Busca */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título ou ID..."
              className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Filtros à direita */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button className="flex-1 md:flex-none flex items-center justify-between gap-3 h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              Todos os Eixos
              <ChevronDown className="size-4 text-slate-400" />
            </button>
            <button className="flex items-center justify-center size-12 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm shrink-0">
              <Filter className="size-5" />
            </button>
          </div>

        </div>

        {/* =========================================
            LISTA DE TEMAS (CARDS)
        ========================================= */}
        {/* =========================================
            LISTA DE TEMAS (CARDS)
        ========================================= */}
        <div className="flex flex-col gap-4">
          {themesData.map((theme) => (
            <div
              key={theme.id}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow group"
            >

              {/* Informações do Tema */}
              <div className="space-y-3 flex-1">
                {/* Eixo (ID removido conforme solicitado) */}
                <div className="flex items-center gap-3">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                    {theme.axis}
                  </span>
                </div>

                {/* Título */}
                <h2 className="text-lg font-black text-slate-900 leading-snug max-w-2xl">
                  {theme.title}
                </h2>

                {/* Rodapé do Card (Data com prefixo e Status) */}
                <div className="flex items-center gap-5 text-xs font-bold pt-1">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="size-4" />
                    Cadastrado em {theme.date}
                  </span>
                  {theme.status === 'Ativo' ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                      Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <FileText className="size-4" />
                      Rascunho
                    </span>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 shrink-0 pt-4 md:pt-0 border-t border-slate-100 md:border-t-0 mt-2 md:mt-0">

                {/* NOVO: Botão Ver Proposta */}
                <Button
                  variant="ghost"
                  className="rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold px-4 h-10 transition-colors"
                >
                  <Eye className="size-4 mr-2" /> Ver Proposta
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full border-blue-100 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 font-bold px-5 h-10 shadow-none transition-colors"
                >
                  <Pencil className="size-4 mr-2" /> Editar
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Excluir Tema"
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}