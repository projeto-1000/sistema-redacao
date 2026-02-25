"use client";

import { CompetencyCard } from "@/components/competency-card";
import { EssayViewer } from "@/components/essay-viewer";
import { StickyScore } from "@/components/sticky-score";
import { useGradingStore } from "@/stores/use-grading-store";
import { MotivationalText } from "@repo/types";
import { formatDate } from "@repo/utils";
import { Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";

const COMPETENCIES = [
  { id: "C1", title: "Domínio da Norma Culta", description: "Demonstrar domínio da modalidade escrita formal da língua portuguesa." },
  { id: "C2", title: "Compreensão do Tema", description: "Compreender a proposta e aplicar conceitos dentro da estrutura dissertativo-argumentativa." },
  { id: "C3", title: "Organização de Ideias", description: "Selecionar e organizar informações em defesa de um ponto de vista." },
  { id: "C4", title: "Coesão Textual", description: "Demonstrar conhecimento dos mecanismos linguísticos necessários para a argumentação." },
  { id: "C5", title: "Proposta de Intervenção", description: "Elaborar proposta de intervenção detalhada respeitando os direitos humanos." },
];

interface EssayCorrectionClientProps {
  essay: {
    id: string;
    student: string;
    topic: string;
    title: string;
    text: string;
    created_at: string,
    motivationalTexts: MotivationalText[]
  };
}

export function EssayCorrectionClient({ essay }: EssayCorrectionClientProps) {
  const [activeTab, setActiveTab] = useState<"text" | "proposal">("text");

  const generalComment = useGradingStore((state) => state.generalComment);
  const setGeneralComment = useGradingStore((state) => state.setGeneralComment);
  const resetStore = useGradingStore((state) => state.reset);

  useEffect(() => {
    return () => resetStore();
  }, [resetStore]);

  return (
    <div className="min-h-screen flex flex-col">

      <div className="px-6 md:px-10 py-6 space-y-4">
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

      <div className="flex-1 px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        <EssayViewer
          essay={essay}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="lg:col-span-5 flex flex-col gap-6 relative">
          {COMPETENCIES.map((comp) => (
            <CompetencyCard
              key={comp.id}
              comp={comp}
            />
          ))}

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-32">
            <h3 className="font-bold mb-4">Comentário Geral</h3>
            <textarea
              placeholder="Dê um feedback holístico para o aluno..."
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