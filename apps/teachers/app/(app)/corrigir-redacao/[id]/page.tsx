import { EssayCorrectionWorkspace } from "@/components/essay-correction-workspace";
import { getEssayById } from "@/app/actions/essays";
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

  return <EssayCorrectionWorkspace essay={essay} />;
}