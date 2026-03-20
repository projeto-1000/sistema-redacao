import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { EssayType } from "@repo/types";

interface PendingEssayTableProps {
  essays: EssayType[];
  type: 'admin' | 'teacher'
  emptyState: React.ReactNode;
}

export function PendingEssayTable({ essays, type, emptyState }: PendingEssayTableProps) {

  const renderStatusBadge = (status: string, text: string, label: string) => {
    let classes = "border-blue-500 text-blue-700 bg-blue-100";

    if (status === 'urgent' || status === 'expired') {
      classes = "border-red-500 text-red-700 bg-red-100";
    } else if (status === 'warning') {
      classes = "border-amber-400 text-amber-700 bg-amber-100";
    }

    return (
      <div className={`
        inline-flex px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border tracking-wide 
        whitespace-nowrap items-center justify-center gap-1.5 ${classes}
      `} title={label}>
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
      <div className={`hidden lg:grid grid-cols-12 gap-4 px-8 ${type === 'admin' ? 'pb-5' : 'py-5'} border-b border-slate-100 ${type === 'admin' ? 'bg-transparent' : 'bg-slate-50/50'}`}>
        <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
        <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tema da Redação</div>
        <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo</div>
        <div className="col-span-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação</div>
      </div>

      <div className="divide-y divide-slate-100">
        {essays.map((essay) => (
          <div key={essay.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors group">

            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                {essay.student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
                  {essay.student}
                </h4>
                <span className="text-xs text-slate-400 ">Enviado em {essay.submissionDate}</span>
              </div>
            </div>

            <div className="lg:col-span-5 mt-2 lg:mt-0">
              <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tema</span>
              <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.topic}>{essay.topic}</p>
            </div>

            <div className="lg:col-span-2 flex lg:justify-center">
              {renderStatusBadge(essay.status, essay.deadline, essay.deadlineLabel)}
            </div>

            <div className="lg:col-span-1 flex justify-end">
              <Button asChild variant={type === 'admin' ? "secondary" : "default"} className="rounded-full font-bold shadow-sm h-9 whitespace-nowrap transition-transform">
                <Link href={`/corrigir-redacao/${essay.id}`}>
                  Corrigir <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}