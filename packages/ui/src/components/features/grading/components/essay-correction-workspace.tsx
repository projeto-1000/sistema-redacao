"use client";

import { useEffect, useRef, useState } from "react";
import { CompetencyCard } from "./competency-card";
import { EssayViewer, Highlight } from "./essay-viewer";
import { StickyScore } from "./sticky-score";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CorrectionPayload, EssayStatus } from "@repo/types";
import { COMPETENCIES } from "@repo/constants";
import EssayHeader from "../../essays/components/essay-header";
import { ReturnEssayDialog, ReturnEssayParams } from "./return-essay-dialog";
interface EssayCorrectionWorkspaceProps {
  essay: {
    id: string;
    student: string;
    title: string;
    content: string;
    created_at: string;
    status: EssayStatus;
  };
  initialDraft?: CorrectionPayload | null;
  onAutoSave?: (payload: CorrectionPayload) => void;
  onSaveCorrection: (payload: CorrectionPayload) => Promise<{ success: boolean; error?: string }>;
  redirectPath: string;
  onReturnEssay: (params: ReturnEssayParams) => Promise<{ success: boolean; error?: string }>;
}

export function EssayCorrectionWorkspace({
  essay,
  initialDraft,
  onAutoSave,
  onSaveCorrection,
  redirectPath,
  onReturnEssay
}: EssayCorrectionWorkspaceProps) {
  const router = useRouter();

  const [scores, setScores] = useState<Record<string, number>>(
    initialDraft?.scores || { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }
  );

  const [comments, setComments] = useState<Record<string, string>>(
    initialDraft?.comments || { c1: "", c2: "", c3: "", c4: "", c5: "" }
  );

  const [generalComment, setGeneralComment] = useState(
    initialDraft?.general_comment || ""
  );

  const [highlights, setHighlights] = useState<Highlight[]>(
    (initialDraft?.highlights as Highlight[]) || []
  );

  const [activeHighlightComp, setActiveHighlightComp] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const payload: CorrectionPayload = {
      scores: {
        c1: scores.c1 || 0,
        c2: scores.c2 || 0,
        c3: scores.c3 || 0,
        c4: scores.c4 || 0,
        c5: scores.c5 || 0,
      },
      comments,
      general_comment: generalComment,
      highlights: highlights.map(h => ({
        id: h.id,
        text: h.text,
        compId: h.compId,
        startIndex: h.startIndex,
        endIndex: h.endIndex
      }))
    };

    const timer = setTimeout(() => {
      onAutoSave?.(payload);
    }, 3000);

    return () => clearTimeout(timer);
  }, [scores, comments, generalComment, highlights, onAutoSave]);


  const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr, 0);
  const canSave = Object.values(scores).every(score => score !== undefined) && generalComment.trim().length > 0;

  const handleActivateHighlightMode = (compId: string) => {
    setActiveHighlightComp(prev => prev === compId ? null : compId);
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    const payloadToSave: CorrectionPayload = {
      scores: {
        c1: scores.c1 as number,
        c2: scores.c2 as number,
        c3: scores.c3 as number,
        c4: scores.c4 as number,
        c5: scores.c5 as number,
      },
      comments,
      general_comment: generalComment,
      highlights: highlights.map(h => ({
        id: h.id,
        text: h.text,
        compId: h.compId,
        startIndex: h.startIndex,
        endIndex: h.endIndex
      }))
    };

    try {
      const result = await onSaveCorrection(payloadToSave);
      if (result.success) {
        router.push(redirectPath);
        toast.success("Redação corrigida com sucesso!");
      } else {
        console.error("Erro:", result.error);
      }
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-dvh flex flex-col">
      <EssayHeader
        title={"Espaço de Correção"}
        date={essay.created_at}
        studentName={essay.student}
        status={essay.status}
        className="mb-4 md:mb-6"
      >
        <ReturnEssayDialog
          essayId={essay.id}
          onReturnEssay={onReturnEssay}
        />
      </EssayHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">

        <EssayViewer
          essay={essay}
          highlights={highlights}
          activeHighlightComp={activeHighlightComp}
          onHighlightsChange={setHighlights}
          onActiveHighlightChange={setActiveHighlightComp}
        />

        <div className="lg:col-span-5 flex flex-col gap-6 relative">

          {COMPETENCIES.map((comp) => {
            const compKey = comp.id.toLowerCase();
            return (
              <CompetencyCard
                key={comp.id}
                comp={comp}
                isActiveForHighlight={activeHighlightComp === comp.id}
                onActivateHighlightMode={handleActivateHighlightMode}
                score={scores[compKey]}
                comment={comments[compKey]}
                onScoreChange={(val) => setScores(s => ({ ...s, [compKey]: val }))}
                onCommentChange={(val) => setComments(c => ({ ...c, [compKey]: val }))}
              />
            );
          })}

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

          <StickyScore
            totalScore={totalScore}
            canSave={canSave}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}