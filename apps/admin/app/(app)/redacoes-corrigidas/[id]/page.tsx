
import { notFound } from "next/navigation";
import { getGradedEssay } from "@/app/action/essays";
import { GradedEssayView } from "@/components/graded-essay-view";

export default async function GradedEssayPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const essay = await getGradedEssay(id);

  if (!essay) return notFound();

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4">

      <GradedEssayView essayId={id} />

    </div>
  );
}