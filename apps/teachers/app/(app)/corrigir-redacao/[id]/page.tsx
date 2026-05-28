import { getCorrectionDraft, saveCorrectionDraft } from "@/app/actions/drafts";
import { getEssayById, saveEssayCorrection } from "@/app/actions/essays";
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

  const [essay, draft] = await Promise.all([
    getEssayById(id),
    getCorrectionDraft(id)
  ]);

  if (!essay) {
    notFound();
  }

  const boundAutoSave = saveCorrectionDraft.bind(null, id);
  const boundFinalSave = saveEssayCorrection.bind(null, id);

  return (
    <EssayCorrectionWorkspace
      essay={essay}
      initialDraft={draft}
      onAutoSave={boundAutoSave}
      onSaveCorrection={boundFinalSave}
      redirectPath="/redacoes-corrigidas"
    />)

}