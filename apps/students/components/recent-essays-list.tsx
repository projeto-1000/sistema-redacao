"use client";

import { FileText, NotebookPen } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";

interface Essay {
  id: string;
  title: string;
  date: string;
  status: "pending" | "corrected";
  score?: number;
}

interface RecentEssaysListProps {
  hasData?: boolean;
  essays?: Essay[];
}

export function RecentEssaysList({ hasData = false, essays = [] }: RecentEssaysListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <FileText className="size-5" /> Redações Recentes
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
          {essays.map((essay) => (
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
                    className={`text-sm font-bold ${essay.status === "pending" ? "text-primary" : "text-success"
                      }`}
                  >
                    {essay.status === "pending" ? "Em correção" : "Corrigida"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                    Nota
                  </span>
                  <span className={`text-2xl font-extrabold ${essay.status === 'pending' ? 'text-slate-400' : 'text-foreground'}`}>
                    {essay.score ? essay.score : "---"}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                disabled={essay.status === "pending"}
                className="w-full bg-accent text-secondary hover:bg-accent/80 hover:text-secondary font-bold rounded-xl h-10"
              >
                <Link href={`/minhas-redacoes/${essay.id}`}>
                  Ver Detalhes
                </Link>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-border bg-white/50 min-h-[250px] text-center">
          <div className="bg-muted p-4 rounded-full mb-4">
            <NotebookPen className="size-6 text-muted-foreground" />
          </div>
          <h4 className="font-bold text-foreground mb-2">
            Você ainda não enviou nenhuma redação. Que tal começar agora?
          </h4>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Escolha um tema e pratique sua escrita. Nossos corretores estão prontos para te ajudar.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 shadow-lg shadow-primary/20">
            Ver Temas Disponíveis
          </Button>
        </div>
      )}
    </div>
  );
}