
import { notFound } from "next/navigation";
import { GradedEssayView } from "@/components/graded-essay-view";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function GradedEssayPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  if (!id) return notFound();

  return (
    <div className="px-4 md:px-10 lg:px-12 py-4 space-y-4">
      <Link href="/redacoes-corrigidas" className="text-slate-500 flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors w-fit">
        <ArrowLeft className="size-4" />
        Voltar para lista de redações corrigidas
      </Link>
      <GradedEssayView essayId={id} />

    </div>
  );
}