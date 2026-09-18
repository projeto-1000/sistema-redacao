import { getCorrectionDraft, saveCorrectionDraft } from "@/app/actions/drafts";
import { getProfileData } from "@/app/actions/profile";
import {
  getEssayById,
  getLatestCorrectionReviewState,
  saveEssayCorrection,
  returnEssay,
} from "@/app/actions/essays";
import { EssayCorrectionWorkspace } from "@repo/ui/components/features/grading/components/essay-correction-workspace";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageSquareWarning } from "lucide-react";

export const metadata: Metadata = {
  title: "Espaço de Correção",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EssayCorrectionPage(props: Props) {
  const { id } = await props.params;

  const [essay, reviewState, profileData] = await Promise.all([
    getEssayById(id),
    getLatestCorrectionReviewState(id),
    getProfileData(),
  ]);

  if (!essay) {
    notFound();
  }

  const isPendingReview = reviewState?.status === "pending_review";
  const correctionReviewRequired =
    profileData?.user.correction_review_required === true;
  const draft = isPendingReview ? null : await getCorrectionDraft(id);

  const boundAutoSave = saveCorrectionDraft.bind(null, id);
  const boundFinalSave = saveEssayCorrection.bind(null, id);

  return (
    <div className="space-y-4">
      {reviewState?.status === "returned_to_teacher" && (
        <div className="mb-2 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950 md:mb-8">
          <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-bold">Correção devolvida para ajustes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              {reviewState.feedback}
            </p>
          </div>
        </div>
      )}

      <EssayCorrectionWorkspace
        essay={essay}
        initialDraft={
          isPendingReview
            ? reviewState.payload
            : draft ?? reviewState?.payload ?? null
        }
        onAutoSave={isPendingReview ? undefined : boundAutoSave}
        onSaveCorrection={boundFinalSave}
        onReturnEssay={reviewState ? undefined : returnEssay}
        redirectPath="/redacoes-corrigidas"
        readOnly={isPendingReview}
        saveButtonLabel={
          correctionReviewRequired ? "Enviar para revisão" : undefined
        }
        savingLabel={
          correctionReviewRequired ? "Enviando para revisão..." : undefined
        }
      />
    </div>
  )
}
