"use client";

import {
  approveSupervisedCorrectionWithChanges,
  type PendingCorrectionReviewDetails,
} from "@/app/actions/correction-reviews";
import { ApproveCorrectionReviewDialog } from "@/components/approve-correction-review-dialog";
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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <UserPen className="size-4" />
          Professor: {review.teacher.name}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" />
          Enviada em {formatSubmittedAt(review.submittedAt)}
        </span>
        <span className="rounded-full border border-violet-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">
          {isEditing ? "Editando correção" : "Aguardando revisão"}
        </span>

        {!isEditing && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-violet-300 font-bold text-violet-700 hover:bg-violet-100"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-4" />
              Editar correção
            </Button>
            <ApproveCorrectionReviewDialog submissionId={review.id} />
          </div>
        )}
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
