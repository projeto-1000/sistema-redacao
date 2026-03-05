import { getEssayById } from "@/services/essays";
import { notFound } from "next/navigation";
import { EssayCorrectionClient } from "./_components/essay-correction-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EssayCorrectionPage({ params }: PageProps) {
  const { id } = await params;

  const essay = await getEssayById(id);

  if (!essay) {
    notFound();
  }

  const formattedEssay = {
    id: essay.id,
    student: essay.student.full_name || "Aluno(a)",
    topic: essay.title,
    title: essay.title,
    text: essay.content,
    created_at: essay.created_at,
    motivationalTexts: essay.motivational_texts
  };

  return <EssayCorrectionClient essay={formattedEssay} />;
}