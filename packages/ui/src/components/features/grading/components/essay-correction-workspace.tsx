"use client";

import { useEffect, useRef, useState } from "react";
import { CompetencyCard } from "./competency-card";
import { EssayViewer, Highlight } from "./essay-viewer";
import { StickyScore } from "./sticky-score";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  CorrectionCompetencyId,
  CorrectionPayload,
  EssayStatus,
} from "@repo/types";
import { COMPETENCIES } from "@repo/constants";
import EssayHeader from "../../essays/components/essay-header";
import { ReturnEssayDialog, ReturnEssayParams } from "./return-essay-dialog";
import { CorrectionSummaryFields } from "./correction-summary-fields";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  finalCorrectionSchema,
  type FinalCorrectionInput,
} from "@repo/validators";
import { useForm } from "react-hook-form";
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

function normalizeInitialFormValues(
  initialDraft?: CorrectionPayload | null
): FinalCorrectionInput {
  const priorities =
    initialDraft?.next_essay_priorities ?? [];

  const rewriteTasks =
    initialDraft?.rewrite_tasks ?? [];

  return {
    scores: initialDraft?.scores ?? {
      c1: 0,
      c2: 0,
      c3: 0,
      c4: 0,
      c5: 0,
    },

    comments: initialDraft?.comments ?? {
      c1: "",
      c2: "",
      c3: "",
      c4: "",
      c5: "",
    },

    general_comment: initialDraft?.general_comment ?? "",

    main_bottleneck: initialDraft?.main_bottleneck ?? "",

    next_essay_priorities:
      priorities.length > 0
        ? priorities.slice(0, 3)
        : [""],

    rewrite_tasks:
      rewriteTasks.length > 0
        ? rewriteTasks.slice(0, 3)
        : [""],

    highlights: initialDraft?.highlights ?? [],
  };
}

function serializeHighlights(
  highlights: FinalCorrectionInput["highlights"]
): CorrectionPayload["highlights"] {
  return highlights.map((highlight) => ({
    id: highlight.id,
    text: highlight.text,
    compId: highlight.compId,
    comment: highlight.comment ?? "",
    startIndex: highlight.startIndex,
    endIndex: highlight.endIndex,
  }));
}

function serializeCorrectionPayload(
  payload: FinalCorrectionInput
): CorrectionPayload {
  return {
    ...payload,
    highlights: serializeHighlights(payload.highlights),
  };
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

  const {
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: {
      isValid,
      isSubmitting,
    },
  } = useForm<FinalCorrectionInput>({
    resolver: zodResolver(finalCorrectionSchema),
    mode: "onChange",
    defaultValues: normalizeInitialFormValues(initialDraft),
  });

  const scores = watch("scores");
  const comments = watch("comments");
  const generalComment = watch("general_comment");
  const mainBottleneck = watch("main_bottleneck");
  const nextEssayPriorities = watch(
    "next_essay_priorities"
  );
  const rewriteTasks = watch("rewrite_tasks");


  const [highlights, setHighlights] = useState<Highlight[]>(
    (initialDraft?.highlights as Highlight[]) || []
  );

  const [activeHighlightComp, setActiveHighlightComp] = useState<string | null>(null);

  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);

  const isInitialMount = useRef(true);

  useEffect(() => {
    setValue(
      "highlights",
      serializeHighlights(highlights),
      {
        shouldValidate: true,
      }
    );
  }, [highlights, setValue]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const payload = serializeCorrectionPayload(getValues());

      onAutoSave?.(payload);
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    scores,
    comments,
    generalComment,
    mainBottleneck,
    nextEssayPriorities,
    rewriteTasks,
    highlights,
    getValues,
    onAutoSave,
  ]);

  const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr, 0);

  const handleActivateHighlightMode = (compId: string) => {
    setActiveHighlightComp(prev => prev === compId ? null : compId);
  };

  const handleHighlightCommentChange = (id: string, comment: string) => {
    setHighlights((currentHighlights) =>
      currentHighlights.map((highlight) =>
        highlight.id === id
          ? { ...highlight, comment }
          : highlight
      )
    );
  };

  const handleSave = handleSubmit(
    async (payload) => {
      try {
        const result =
          await onSaveCorrection(serializeCorrectionPayload(payload));

        if (result.success) {
          toast.success(
            "Redação corrigida com sucesso!"
          );

          setIsRedirecting(true);
          router.push(redirectPath);
          return;
        }

        toast.error(
          result.error ??
          "Não foi possível salvar a correção."
        );
      } catch (error) {
        console.error(
          "Erro ao salvar correção:",
          error
        );

        toast.error(
          "Não foi possível salvar a correção."
        );
      }
    },
    (errors) => {
      console.error(
        "Correção inválida:",
        errors
      );

      toast.error(
        "Preencha todos os campos obrigatórios antes de finalizar."
      );
    }
  );


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

      <div className="grid grid-cols-1 items-start gap-8 pb-20 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <EssayViewer
            essay={essay}
            highlights={highlights}
            activeHighlightComp={activeHighlightComp}
            activeHighlightId={activeHighlightId}
            onHighlightsChange={setHighlights}
            onActiveHighlightChange={setActiveHighlightComp}
            onActiveHighlightIdChange={setActiveHighlightId}
            onHighlightCommentChange={handleHighlightCommentChange}
          />

          <CorrectionSummaryFields
            mainBottleneck={mainBottleneck}
            onMainBottleneckChange={(value) =>
              setValue(
                "main_bottleneck",
                value,
                { shouldDirty: true, shouldValidate: true }
              )
            }
            nextEssayPriorities={nextEssayPriorities}
            onNextEssayPrioritiesChange={(value) =>
              setValue(
                "next_essay_priorities",
                value,
                { shouldDirty: true, shouldValidate: true }
              )
            }
            rewriteTasks={rewriteTasks}
            onRewriteTasksChange={(value) =>
              setValue(
                "rewrite_tasks",
                value,
                { shouldDirty: true, shouldValidate: true }
              )
            }
          />
        </div>

        <div className="relative flex flex-col gap-6 lg:col-span-5">
          {COMPETENCIES.map((comp) => {
            const compKey = comp.id.toLowerCase() as CorrectionCompetencyId;

            return (
              <CompetencyCard
                key={comp.id}
                comp={comp}
                isActiveForHighlight={activeHighlightComp === comp.id}
                onActivateHighlightMode={handleActivateHighlightMode}
                score={scores[compKey]}
                comment={comments[compKey]}
                highlights={highlights.filter(
                  (highlight) => highlight.compId === compKey
                )}
                activeHighlightId={activeHighlightId}
                onSelectHighlight={setActiveHighlightId}
                onScoreChange={(value) =>
                  setValue(
                    `scores.${compKey}`,
                    value,
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
                onCommentChange={(value) =>
                  setValue(
                    `comments.${compKey}`,
                    value,
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
              />
            );
          })}

          <div className="mb-32 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold">Comentário Geral</h3>

            <textarea
              suppressHydrationWarning
              placeholder="Dê um feedback para o aluno..."
              className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400/50"
              value={generalComment}
              onChange={(event) =>
                setValue(
                  "general_comment",
                  event.target.value,
                  { shouldDirty: true, shouldValidate: true }
                )
              }
            />
          </div>

          <StickyScore
            totalScore={totalScore}
            canSave={isValid}
            isSaving={isSubmitting || isRedirecting}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
