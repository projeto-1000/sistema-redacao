import { getCorrectionDraft, saveCorrectionDraft } from "@/app/actions/drafts";
import {
  getEssayById,
  getLatestPendingReviewSubmission,
  saveEssayCorrection,
  returnEssay,
} from "@/app/actions/essays";
import { EssayCorrectionWorkspace } from "@repo/ui/components/features/grading/components/essay-correction-workspace";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espaço de Correção",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EssayCorrectionPage(props: Props) {
  const { id } = await props.params;

  const [essay, pendingReviewSubmission] = await Promise.all([
    getEssayById(id),
    getLatestPendingReviewSubmission(id),
  ]);

  if (!essay) {
    notFound();
  }

  const draft = pendingReviewSubmission ? null : await getCorrectionDraft(id);

  const boundAutoSave = saveCorrectionDraft.bind(null, id);
  const boundFinalSave = saveEssayCorrection.bind(null, id);

  return (
    <EssayCorrectionWorkspace
      essay={essay}
      initialDraft={pendingReviewSubmission?.payload ?? draft}
      onAutoSave={pendingReviewSubmission ? undefined : boundAutoSave}
      onSaveCorrection={boundFinalSave}
      onReturnEssay={returnEssay}
      redirectPath="/redacoes-corrigidas"
      readOnly={Boolean(pendingReviewSubmission)}
    />
  )
}
