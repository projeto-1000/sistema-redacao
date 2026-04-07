"use client";

import { FilePenLine, FileText, NotebookPen } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { EssayStatus } from "@repo/types";

interface Essay {
  id: string;
  title: string;
  date: string;
  status: EssayStatus;
  score?: number;
}

interface RecentEssaysListProps {
  hasData?: boolean;
  essays?: Essay[];
}

const STATUS_MAP = {
  pending: { label: 'Pendente', textColor: 'text-primary' },
  draft: { label: 'Rascunho', textColor: 'text-slate-500' },
  corrected: { label: 'Corrigida', textColor: 'text-success' },
  correcting: { label: 'Em correção', textColor: 'text-secondary' },
  returned: { label: 'Devolvida', textColor: 'text-amber-700' },
}

export function RecentEssaysList({ hasData = false, essays = [] }: RecentEssaysListProps) {

  return (

    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <FileText className="size-10 rounded-xl bg-amber-100/50 text-primary p-2" /> Redações Recentes
        </h3>
        {hasData && (
          <Link href="/minhas-redacoes">
            <p className="text-sm font-bold text-secondary hover:underline">
              Ver todas as redações
            </p>
          </Link>
        )}
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {essays.map((essay) => {
            const { label, textColor } = STATUS_MAP[essay.status] || STATUS_MAP.pending;

            return (
              <div
                key={essay.id}
                className="flex flex-col p-6 rounded-3xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-foreground text-lg leading-snug mb-2 line-clamp-2">
                    {essay.title}
                  </h4>
                  <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide">
                    {essay.date}
                  </span>
                </div>

                <div className="h-px w-full bg-slate-100 my-4" />

                <div className="flex items-end justify-between mb-6">
                  <div className="flex flex-col gap-1">
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
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        Nota
                      </span>
                      <span className='text-2xl font-extrabold text-foreground'>
                        {essay.score}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  disabled={essay.status !== 'corrected'}
                  className="w-full bg-accent text-secondary hover:bg-accent/80 hover:text-secondary font-bold rounded-xl h-10"
                >
                  <Link href={`/minhas-redacoes/${essay.id}`}>
                    Ver Detalhes
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-border bg-white/50 min-h-[250px] text-center">
          <FilePenLine className="size-10 p-2.5 rounded-full mb-4 bg-amber-100" />
          <h4 className="font-bold mb-2">
            Você ainda não enviou nenhuma redação. Que tal começar agora?
          </h4>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Escolha um tema e pratique sua escrita. Nossos corretores estão prontos para te ajudar.
          </p>
          <Button
            asChild
            className="py-6 font-bold rounded-2xl px-8 shadow-lg shadow-primary/20">
            <Link href="/temas">
              Ver Temas Disponíveis
            </Link>
          </Button>
        </div>
      )
      }

    </div >
  );
}