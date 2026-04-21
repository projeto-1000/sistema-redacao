import { getEssayById, saveEssayCorrection } from "@/app/actions/essays";
import { EssayCorrectionWorkspace } from "@repo/ui/components/features/grading/components/essay-correction-workspace";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EssayCorrectionPage(props: Props) {
  const { id } = await props.params;

  const essay = await getEssayById(id);

  if (!essay) {
    notFound();
  }

  return (
    <EssayCorrectionWorkspace
      essay={essay}
      onSaveCorrection={saveEssayCorrection}
      redirectPath="/redacoes-corrigidas"
    />)

}