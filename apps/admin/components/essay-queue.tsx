import { getEssaysByStatus } from "@/app/action/essays";
import { EssayType } from "@repo/types";
import { PendingEssayTable } from "@repo/ui/components/pending-essay-table";
import { formatDate, getDeadlineInfo, getHolidays } from "@repo/utils";
import { FileText } from "lucide-react";

export default async function EssayQueue() {
  const rawEssays = await getEssaysByStatus({ status: 'pending', limit: 10 });

  const holidays = await getHolidays();

  const pendingEssays: EssayType[] = (rawEssays || []).map((essay) => {
    const studentName = (essay.student as unknown as { full_name: string })?.full_name || "Aluno(a)";
    const deadlineInfo = getDeadlineInfo(essay.created_at, holidays);
    const submissionDate = formatDate(essay.created_at, "numeric");

    return {
      id: essay.id,
      student: studentName,
      topic: essay.title,
      submissionDate: submissionDate,
      deadline: deadlineInfo.text,
      status: deadlineInfo.status as EssayType['status'],
      deadlineLabel: deadlineInfo.label
    };
  });


  return (
    <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm mt-8 bg-white">

      <div className="flex justify-between items-center p-8">
        <h3 className="text-lg font-bold">Fila de Correção</h3>
        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Ver fila completa
        </button>
      </div>

      <PendingEssayTable
        essays={pendingEssays}
        type='admin'
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <FileText className="size-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Fila vazia</h3>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Todas as redações já foram corrigidas. A equipe está de parabéns!
            </p>
          </div>}
      />

    </div>
  )
}