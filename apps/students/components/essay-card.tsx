'use client'

import { deleteDraftEssay } from "@/app/actions/essay-drafts";
import { EssayListItem } from "@/types";
import { Button } from "@repo/ui/components/button";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { formatDate } from "@repo/utils";
import { ArrowRight, Calendar1Icon, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@repo/ui/components/alert-dialog";
import { useTransition } from "react";
interface EssayCardProps {
  essay: EssayListItem;
}

export function EssayCard({ essay }: EssayCardProps) {
  const isDraft = essay.status === "draft";

  const STATUS_MAP = {
    pending: { label: 'Pendente', textColor: 'text-primary' },
    draft: { label: 'Rascunho', textColor: 'text-slate-500' },
    corrected: { label: 'Corrigida', textColor: 'text-success' },
    correcting: { label: 'Em correção', textColor: 'text-secondary' },
    returned: { label: 'Devolvida', textColor: 'text-amber-700' },
  }

  const { label, textColor } = STATUS_MAP[essay.status] || STATUS_MAP.pending;

  const [isPending, startTransition] = useTransition();
  const onConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await deleteDraftEssay(essay.id);

        if (result.success) {
          toast.success("Rascunho excluído com sucesso.");
        }
      } catch (error) {
        console.error("Falha ao excluir:", error);
        toast.error("Erro ao excluir rascunho. Tente novamente.");
      }
    });
  };
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

      {isDraft ? (
        <div className="flex gap-2 w-full">
          <Button
            asChild
            className="flex-1 bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold rounded-xl h-10 gap-2"
          >
            <Link href={`/minhas-redacoes/nova-redacao?id=${essay.topic_id}`}>
              Continuar Redação <ArrowRight className="size-4" />
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="h-10 bg-red-100 shrink-0 hover:bg-red-200 transition-colors rounded-lg">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Você perderá todo o progresso feito nesta redação até agora.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmDelete}
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                >
                  {isPending ? "Excluindo..." : "Sim, excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      ) : (
        <Button
          asChild
          variant="ghost"
          disabled={essay.status === "pending" || essay.status === "correcting"}
          className="w-full bg-accent text-secondary hover:bg-accent/80 font-bold rounded-xl h-10"
        >
          <Link href={`/minhas-redacoes/${essay.id}`}>
            Ver Correção
          </Link>
        </Button>
      )
      }

    </div >
  );
}