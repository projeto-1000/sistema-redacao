import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { EssayType } from "@repo/types";

interface PendingEssayTableProps {
  essays: EssayType[];
  type: "admin" | "teacher";
  emptyState: React.ReactNode;
}

export function PendingEssayTable({ essays, type, emptyState }: PendingEssayTableProps) {
  const renderStatusBadge = (status: string, text: string, label: string) => {
    let classes = "border-blue-500 text-blue-700 bg-blue-100";

    if (status === "urgent" || status === "expired") {
      classes = "border-red-500 text-red-700 bg-red-100";
    } else if (status === "warning") {
      classes = "border-amber-400 text-amber-700 bg-amber-100";
    }

    return (
      <div
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase ${classes} `}
        title={label}
      >
        <Clock className="size-3" />
        {text}
      </div>
    );
  };

  if (essays.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      <div
        className={`hidden grid-cols-12 gap-4 px-8 lg:grid ${type === "admin" ? "pb-5" : "py-5"} border-b border-slate-100 ${type === "admin" ? "bg-transparent" : "bg-slate-50/50"}`}
      >
        <div className="col-span-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Aluno
        </div>
        <div className="col-span-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Tema da Redação
        </div>
        <div className="col-span-2 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Prazo
        </div>
        <div className="col-span-1 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Ação
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {essays.map((essay) => (
          <div
            key={essay.id}
            className="group grid grid-cols-1 items-center gap-2 px-8 py-5 transition-colors hover:bg-slate-50 lg:grid-cols-12 lg:gap-4"
          >
            <div className="flex items-center gap-4 lg:col-span-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
                {essay.student
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm leading-snug font-bold transition-colors group-hover:text-[#1E3A8A]">
                  {essay.student}
                </h4>
                <span className="text-xs text-slate-400">Enviado em {essay.submissionDate}</span>
              </div>
            </div>

            <div className="mt-2 lg:col-span-5 lg:mt-0">
              <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
                Tema
              </span>
              <p className="line-clamp-2 text-sm leading-snug font-medium" title={essay.topic}>
                {essay.topic}
              </p>
            </div>

            <div className="flex lg:col-span-2 lg:justify-center">
              {renderStatusBadge(essay.status, essay.deadline, essay.deadlineLabel)}
            </div>

            <div className="flex justify-end lg:col-span-1">
              <Button
                asChild
                variant={type === "admin" ? "secondary" : "default"}
                className="h-9 rounded-full font-bold whitespace-nowrap shadow-sm transition-transform"
              >
                <Link href={`/corrigir-redacao/${essay.id}`}>
                  Corrigir <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
