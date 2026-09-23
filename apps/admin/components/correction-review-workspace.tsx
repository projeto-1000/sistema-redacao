"use client";

import {
  approveSupervisedCorrectionWithChanges,
  type PendingCorrectionReviewDetails,
} from "@/app/actions/correction-reviews";
import { ApproveCorrectionReviewDialog } from "@/components/approve-correction-review-dialog";
import { ReturnCorrectionReviewDialog } from "@/components/return-correction-review-dialog";
import { Button } from "@repo/ui/components/button";
import { EssayCorrectionWorkspace } from "@repo/ui/components/features/grading/components/essay-correction-workspace";
import type { CorrectionPayload } from "@repo/types";
import { Clock, Pencil, UserPen } from "lucide-react";
import { useState } from "react";

interface CorrectionReviewWorkspaceProps {
  review: PendingCorrectionReviewDetails;
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function CorrectionReviewWorkspace({ review }: CorrectionReviewWorkspaceProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleApproveWithChanges = (payload: CorrectionPayload) =>
    approveSupervisedCorrectionWithChanges(review.id, payload);

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <UserPen className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">Revisão da correção</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{review.teacher.name}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Enviada em {formatSubmittedAt(review.submittedAt)}
                </span>
              </p>
            </div>
          </div>

          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">
            {isEditing ? "Editando correção" : "Aguardando revisão"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-500">
            {isEditing
              ? "Faça os ajustes necessários e aprove a correção ao finalizar."
              : "Confira a correção enviada pelo professor e escolha o próximo passo."}
          </p>

          {!isEditing && (
            <div className="flex flex-wrap items-center gap-2">
              <ReturnCorrectionReviewDialog submissionId={review.id} />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl font-bold"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
              <ApproveCorrectionReviewDialog submissionId={review.id} />
            </div>
          )}
        </div>
      </div>

      <EssayCorrectionWorkspace
        essay={{
          id: review.essay.id,
          student: review.essay.studentName,
          title: review.essay.title,
          content: review.essay.content,
          created_at: review.essay.createdAt,
          status: review.essay.status,
          motivational_texts: review.essay.motivationalTexts,
          motivational_texts_load_error: review.essay.motivationalTextsLoadError,
        }}
        initialDraft={review.payload}
        onSaveCorrection={handleApproveWithChanges}
        redirectPath="/redacoes-pendentes?tab=revisoes"
        readOnly={!isEditing}
        saveButtonLabel="Aprovar com alterações"
        savingLabel="Aprovando..."
        successMessage="Correção aprovada com alterações e enviada ao aluno."
      />
    </>
  );
}
