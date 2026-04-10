
import { EssayListItem } from "@/types";
import { Button } from "@repo/ui/components/button";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { formatDate } from "@repo/utils";
import { Calendar1Icon } from "lucide-react";
import Link from "next/link";
interface EssayCardProps {
  essay: EssayListItem;
}

export function EssayCard({ essay }: EssayCardProps) {

  const STATUS_MAP = {
    pending: { label: 'Pendente', textColor: 'text-primary' },
    draft: { label: 'Rascunho', textColor: 'text-slate-500' },
    corrected: { label: 'Corrigida', textColor: 'text-success' },
    correcting: { label: 'Em correção', textColor: 'text-secondary' },
    returned: { label: 'Devolvida', textColor: 'text-amber-700' },
  }

  const { label, textColor } = STATUS_MAP[essay.status] || STATUS_MAP.pending;

  return (
    <div className="flex flex-col p-6 rounded-3xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex-1">
        <ThemeBadge
          value={essay.thematic_axis}
          className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-4"
        />


        <h3 className="font-bold text-lg leading-snug mb-2 line-clamp-2">
          {essay.title}
        </h3>
        <span className="text-xs font-medium text-slate-500 tracking-wide flex gap-2">
          <Calendar1Icon className="size-3.5" />  {formatDate(essay.submission_date, 'short')}
        </span>
      </div>

      <div className="h-px w-full bg-slate-100 my-4" />

      <div className="flex items-end justify-between mb-3">
        <div className="flex flex-col gap-1 ">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
            Status
          </span>
          <span
            className={`text-sm font-bold ${textColor}`}
          >
            {label}
          </span>
        </div>

        {essay.status === 'corrected' && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nota Final
            </span>
            <span className='text-2xl font-extrabold text-foreground'>
              {essay.total_score}
            </span>
          </div>
        )}
      </div>

      <Button
        asChild={essay.status !== 'pending'}
        variant="ghost"
        disabled={essay.status !== 'corrected'}
        className="w-full bg-accent text-secondary hover:bg-accent/80 hover:text-secondary font-bold rounded-xl h-10"
      >
        <Link href={`/minhas-redacoes/${essay.id}`}>
          Ver Detalhes
        </Link>
      </Button>
    </div>
  );
}