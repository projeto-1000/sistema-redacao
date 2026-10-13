import { notFound } from "next/navigation";
import { GradedEssayView } from "@/components/graded-essay-view";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function GradedEssayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) return notFound();

  return (
    <div className="space-y-4 px-4 py-4 md:px-10 lg:px-12">
      <Link
        href="/redacoes-corrigidas"
        className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Voltar para lista de redações corrigidas
      </Link>
      <GradedEssayView essayId={id} />
    </div>
  );
}
