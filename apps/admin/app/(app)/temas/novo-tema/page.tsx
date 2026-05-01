import {
  PlusCircle,
  Info,
  FileText,
  Trash2,
  ImagePlus,
  Plus
} from "lucide-react";
import { Button } from "@repo/ui/components/button";

export default function NewTopicPage() {
  return (
    <div className="min-h-dvh bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-[900px] mx-auto space-y-8">

        {/* =========================================
            CABEÇALHO DA PÁGINA
        ========================================= */}
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
            <PlusCircle className="size-10 text-secondary" fill="currentColor" stroke="white" />
            Adicionar Novo Tema
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl">
            Configure os detalhes da proposta de redação e anexe os textos de apoio necessários para orientar o estudante.
          </p>
        </div>

        {/* =========================================
            BLOCO 1: INFORMAÇÕES DA PROPOSTA
        ========================================= */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
          <h2 className="text-[11px] font-bold text-blue-600 flex items-center gap-2 mb-6 uppercase tracking-widest">
            <Info className="size-4" /> Informações da Proposta
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest">
                Título da Proposta
              </label>
              <input
                type="text"
                placeholder="Ex: O impacto do descarte de resíduos eletrônicos..."
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest">
                Eixo Temático
              </label>
              <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all bg-white appearance-none cursor-pointer">
                <option value="" disabled selected>Selecionar categoria...</option>
                <option value="meio-ambiente">Meio Ambiente</option>
                <option value="saude">Saúde</option>
                <option value="educacao">Educação</option>
                <option value="tecnologia">Tecnologia</option>
                <option value="social">Social</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================
            CABEÇALHO: TEXTOS MOTIVADORES
        ========================================= */}
        <div className="flex items-center justify-between mt-12 mb-4 px-2">
          <h2 className="text-xl font-black items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <FileText className="size-4" />
            </div>
            Textos Motivadores
          </h2>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full tracking-wider">
            Mínimo 1 obrigatório
          </span>
        </div>

        {/* =========================================
            BLOCO 2: TEXTO MOTIVADOR (CARD COM BADGE)
        ========================================= */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm relative ml-0 md:ml-4">

          {/* Badge flutuante '01' */}
          <div className="absolute -left-4 top-8 size-8 bg-amber-400 rounded-full flex items-center justify-center font-black text-sm shadow-sm hidden md:flex">
            01
          </div>

          <div className="space-y-6">

            {/* Título e Botão Lixeira */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="md:hidden size-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-slate-900">1</span>
                  Título do Texto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Texto I - Dados estatísticos"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0 self-end"
                title="Remover Texto Motivador"
              >
                <Trash2 className="size-5" />
              </Button>
            </div>

            {/* Conteúdo e Imagem */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                  Conteúdo do Texto
                </label>
                <textarea
                  placeholder="Insira aqui o conteúdo integral do texto de apoio..."
                  className="w-full h-44 p-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                  Apoio Visual (Opcional)
                </label>
                <button className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 transition-all group">
                  <div className="size-12 rounded-full bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <ImagePlus className="size-5" />
                  </div>
                  <div className="text-center">
                    <span className="block text-[11px] font-black text-slate-600 group-hover:text-blue-600 uppercase tracking-widest">Upload de Imagem</span>
                    <span className="block text-[10px] font-medium text-slate-400 mt-1">PNG, JPG até 5MB</span>
                  </div>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* =========================================
            BOTÃO: ADICIONAR OUTRO TEXTO
        ========================================= */}
        <div className="ml-0 md:ml-4">
          <button className="w-full h-14 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 flex items-center justify-center gap-2 font-bold transition-all">
            <Plus className="size-5" />
            Adicionar outro texto motivador
          </button>
        </div>

        {/* =========================================
            AÇÕES FINAIS (Salvar / Cancelar)
        ========================================= */}
        <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-slate-200">
          <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100">
            Cancelar
          </Button>
          <Button className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm">
            Salvar e Publicar Tema
          </Button>
        </div>

      </div>
    </div>
  );
}