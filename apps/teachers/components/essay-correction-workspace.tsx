"use client";

import { CompetencyCard } from "@/components/competency-card";
import { EssayViewer } from "@/components/essay-viewer";
import { StickyScore } from "@/components/sticky-score";
import { useGradingStore } from "@/stores/use-grading-store";
import { formatDate } from "@repo/utils";
import { Calendar, User } from "lucide-react";
import { useEffect } from "react";

const COMPETENCIES = [
  { id: "C1", title: "Domínio da Norma Culta", description: "Demonstrar domínio da modalidade escrita formal da língua portuguesa." },
  { id: "C2", title: "Compreensão do Tema", description: "Compreender a proposta e aplicar conceitos dentro da estrutura dissertativo-argumentativa." },
  { id: "C3", title: "Organização de Ideias", description: "Selecionar e organizar informações em defesa de um ponto de vista." },
  { id: "C4", title: "Coesão Textual", description: "Demonstrar conhecimento dos mecanismos linguísticos necessários para a argumentação." },
  { id: "C5", title: "Proposta de Intervenção", description: "Elaborar proposta de intervenção detalhada respeitando os direitos humanos." },
];

interface EssayCorrectionWorkspaceProps {
  essay: {
    id: string;
    student: string;
    title: string;
    content: string;
    created_at: string,
  };
}

export function EssayCorrectionWorkspace({ essay }: EssayCorrectionWorkspaceProps) {

  const activeHighlightComp = useGradingStore((state) => state.activeHighlightComp);
  const setActiveHighlightComp = useGradingStore((state) => state.setActiveHighlightComp);

  const generalComment = useGradingStore((state) => state.generalComment);
  const setGeneralComment = useGradingStore((state) => state.setGeneralComment);
  const resetStore = useGradingStore((state) => state.reset);

  const onActivateHighlightMode = (compId: string) => {
    if (activeHighlightComp === compId) {
      setActiveHighlightComp(null);
    } else {
      setActiveHighlightComp(compId);
    }
  };

  useEffect(() => {
    return () => resetStore();
  }, [resetStore]);

  return (
    <div className="min-h-screen flex flex-col">

      <div className="px-2 md:px-10 py-6 space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold ">
            Espaço de Correção
          </h1>

        </div>


        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <User className="size-4 text-slate-400" />
            {essay.student}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <Calendar className="size-4 text-slate-400" />
            Enviada em {formatDate(essay.created_at, 'long')}
          </div>
        </div>
      </div>

      <div className="px-2 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        <EssayViewer essay={essay} />

        <div className="lg:col-span-5 flex flex-col gap-6 relative">
          {COMPETENCIES.map((comp) => (
            <CompetencyCard
              key={comp.id}
              comp={comp}
              isActiveForHighlight={activeHighlightComp === comp.id}
              onActivateHighlightMode={onActivateHighlightMode}
            />
          ))}

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-32">
            <h3 className="font-bold mb-4">Comentário Geral</h3>
            <textarea
              suppressHydrationWarning
              placeholder="Dê um feedback para o aluno..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400/50 resize-none h-32"
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
            />
          </div>

          <StickyScore essayId={essay.id} />
        </div>
      </div>
    </div>
  );
}