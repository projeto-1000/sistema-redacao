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
  MotivationalText,
} from "@repo/types";
import { COMPETENCIES } from "@repo/constants";
import EssayHeader from "../../essays/components/essay-header";
import { ReturnEssayDialog, ReturnEssayParams } from "./return-essay-dialog";
import { CorrectionSummaryFields } from "./correction-summary-fields";
import { queuePostRedirectSuccessToast } from "../../../post-redirect-toast";
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
    motivational_texts: MotivationalText[];
    motivational_texts_load_error: boolean;
  };
  initialDraft?: CorrectionPayload | null;
  onAutoSave?: (payload: CorrectionPayload) => void | Promise<unknown>;
  onSaveCorrection?: (payload: CorrectionPayload) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    reviewRequired?: boolean;
  }>;
  redirectPath: string;
  onReturnEssay?: (params: ReturnEssayParams) => Promise<{ success: boolean; error?: string }>;
  readOnly?: boolean;
  saveButtonLabel?: string;
  savingLabel?: string;
  successMessage?: string;
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
  onReturnEssay,
  readOnly = false,
  saveButtonLabel = "Enviar Correção",
  savingLabel = "Salvando...",
  successMessage = "Redação corrigida com sucesso!",
}: EssayCorrectionWorkspaceProps) {
  const router = useRouter();

  const {
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: {
      errors,
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
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAutoSaveRef = useRef<Promise<void>>(Promise.resolve());
  const finalizationStartedRef = useRef(false);

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

    if (readOnly || !onAutoSave || finalizationStartedRef.current) {
      return;
    }

    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;

      if (finalizationStartedRef.current) {
        return;
      }

      const payload = serializeCorrectionPayload(getValues());

      pendingAutoSaveRef.current = pendingAutoSaveRef.current
        .then(() => onAutoSave(payload))
        .then(() => undefined)
        .catch((error) => {
          console.error("Erro ao salvar rascunho:", error);
        });
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
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
    readOnly,
  ]);

  const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr, 0);

  const handleActivateHighlightMode = (compId: string) => {
    if (readOnly) return;

    setActiveHighlightComp(prev => prev === compId ? null : compId);
  };

  const submitCorrection = handleSubmit(
    async (payload) => {
      try {
        if (!onSaveCorrection) {
          finalizationStartedRef.current = false;
          toast.error("A finalização não está disponível neste modo.");
          return;
        }

        await pendingAutoSaveRef.current;

        const result =
          await onSaveCorrection(serializeCorrectionPayload(payload));

        if (result.success) {
          const destinationPath = result.reviewRequired
            ? "/redacoes-pendentes"
            : redirectPath;
          const confirmationMessage = result.reviewRequired
            ? result.message ?? "Correção enviada para revisão."
            : successMessage;

          queuePostRedirectSuccessToast(confirmationMessage, destinationPath);
          setIsRedirecting(true);
          router.push(destinationPath);
          return;
        }

        finalizationStartedRef.current = false;

        toast.error(
          result.error ??
          "Não foi possível salvar a correção."
        );
      } catch (error) {
        finalizationStartedRef.current = false;

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
      finalizationStartedRef.current = false;

      console.error(
        "Correção inválida:",
        errors
      );

      toast.error(
        "Preencha todos os campos obrigatórios antes de finalizar."
      );
    }
  );

  const handleSave = () => {
    if (readOnly || finalizationStartedRef.current) {
      return;
    }

    finalizationStartedRef.current = true;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    void submitCorrection();
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
        {!readOnly && onReturnEssay && (
          <ReturnEssayDialog
            essayId={essay.id}
            onReturnEssay={onReturnEssay}
          />
        )}
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
            readOnly={readOnly}
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
            readOnly={readOnly}
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
                commentError={errors.comments?.[compKey]?.message}
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
                readOnly={readOnly}
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
              readOnly={readOnly}
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
            readOnly={readOnly}
            saveButtonLabel={saveButtonLabel}
            savingLabel={savingLabel}
          />
        </div>
      </div>
    </div>
  );
}
