import { getEssaysByStatus } from "@/services/essays";
import { getDeadlineInfo, getHolidays } from "@repo/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

//TODO: melhorar isso aqui 
const STATUS_STYLES = {
  urgent: {
    border: "border-l-red-500",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    timeText: "text-red-500",
  },
  expired: {
    border: "border-l-red-500",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    timeText: "text-red-500",
  },
  warning: {
    border: "border-l-amber-400",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    timeText: "text-amber-400",
  },
  normal: {
    border: "border-l-blue-500",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    timeText: "text-blue-600",
  },
};

export async function NextEssays() {
  const essays = await getEssaysByStatus({ status: 'pending', limit: 3 });

  if (!essays || essays.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 w-full">
        Nenhuma redação pendente no momento.
      </div>
    );
  }

  const holidays = await getHolidays();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {essays.map((essay) => {
        const studentName = (essay.student as unknown as { full_name: string })?.full_name || "Aluno(a)";
        const initials = studentName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

        const deadlineInfo = getDeadlineInfo(essay.created_at, holidays);
        const style = STATUS_STYLES[deadlineInfo.status as keyof typeof STATUS_STYLES];

        return (
          <div
            key={essay.id}
            className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow`}
          >
            {/* Header do Card */}
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="flex gap-2 min-w-0">
                {/* Avatar */}
                <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                  {initials}
                </div>

                {/* Nome e Badge */}
                <div className="flex flex-col items-start gap-1 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${style.badgeBg} ${style.badgeText} whitespace-nowrap`}>
                    {deadlineInfo.label}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight truncate w-full" title={studentName}>
                    {studentName}
                  </h4>
                </div>
              </div>

              {/* Tempo Restante */}
              <div className="text-right shrink-0">
                {deadlineInfo.status !== "expired" && (
                  <span className="text-[10px] font-medium text-slate-400 block mb-0.5">
                    {deadlineInfo.text === '1h' ? 'Resta' : 'Restam'}
                  </span>
                )}

                <span className={`text-2xl font-bold leading-none ${style.timeText}`}>
                  {deadlineInfo.text}
                </span>
              </div>
            </div>

            {/* Corpo do Card (Tema) */}
            <div className="mb-6 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tema da Redação
              </p>
              <p className="text-slate-700 font-medium text-sm leading-relaxed line-clamp-3">
                {essay.title}
              </p>
            </div>

            {/* Botão de Ação - Leva direto para a página de corrigir passando o ID real */}
            <Link
              href={`/corrigir-redacao/${essay.id}`}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors text-sm group"
            >
              Corrigir Agora
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}