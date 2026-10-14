"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@repo/ui/components/dialog";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { BookOpenText, FileText, Info, NotebookPen, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import type { EssayTopic, MotivationalText, EssayTopicDetail } from "@repo/types";
import { cn } from "@repo/ui/lib/utils";

interface TopicDetailsDialogProps {
  topic: EssayTopic;
  className?: string;
  showStartButton?: boolean;
  getTopicDetailsAction: (topicId: string) => Promise<EssayTopicDetail | null>;
}

function MotivatingTextSkeleton() {
  return (
    <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <Skeleton className="mb-3 h-5 w-20 rounded-md bg-slate-200" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-slate-200" />
        <Skeleton className="h-4 w-[90%] bg-slate-200" />
      </div>
    </div>
  );
}

function MotivatingTextItem({ item }: { item: MotivationalText }) {
  return (
    <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <h4 className="mb-3 w-fit rounded-md bg-[#EBC84C]/20 px-2 py-1 text-xs font-bold tracking-widest text-[#8B781F] uppercase">
        Texto {item.text_number}
      </h4>
      <div className="space-y-4">
        {item.body_text && (
          <div className="max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700">
            {item.body_text}
          </div>
        )}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={`Texto ${item.text_number}`}
            className="h-auto max-h-[400px] w-full rounded-lg border border-slate-200 bg-white object-contain"
          />
        )}
        {item.source_reference && (
          <p className="mt-1 text-right text-[10px] font-medium text-slate-400 italic">
            Fonte: {item.source_reference}
          </p>
        )}
      </div>
    </div>
  );
}

export function TopicDetailsDialog({
  topic,
  showStartButton = true,
  getTopicDetailsAction,
  className = "",
}: TopicDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<EssayTopicDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open || details || loading) return;

    setLoading(true);
    getTopicDetailsAction(topic.id)
      .then((data) => {
        setDetails(data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const texts = details?.motivational_texts || [];
  const hasTexts = texts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          suppressHydrationWarning
          variant="outline"
          className={cn(
            "min-h-10 w-1/2 rounded-2xl border-slate-200 text-xs font-bold whitespace-nowrap text-[#1E3A8A] hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900 md:w-fit",
            className
          )}
        >
          Ver Proposta
          <Eye className="size-4.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-xl outline-none focus:ring-0 focus:outline-none md:max-h-[90vh] md:min-w-4xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#EBC84C] p-2 shadow-sm shadow-yellow-200">
              <FileText className="size-5" />
            </div>
            <DialogTitle className="text-xl font-extrabold">Proposta de Redação</DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 bg-white">
          <div className="p-6 md:mx-2 md:p-8">
            <div className="mb-8 rounded-r-2xl border-l-4 border-[#EBC84C] bg-[#FFFDF5] p-6 shadow-sm">
              <h5 className="mb-3 text-[10px] font-bold tracking-widest text-[#8B781F] uppercase">
                Comando da Proposta
              </h5>
              <p className="text-sm leading-relaxed font-medium text-slate-700 md:text-base">
                A partir da leitura dos textos motivadores e com base nos conhecimentos construídos
                ao longo de sua formação, redija texto dissertativo-argumentativo em modalidade
                escrita formal da língua portuguesa sobre o tema:{" "}
                <span className="font-bold text-[#1E3A8A]">{`"${topic.title}"`}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <BookOpenText className="size-5 text-[#1E3A8A]" />
              <h3 className="font-bold">Textos Motivadores</h3>
            </div>
            <hr className="my-2 mb-4 border-slate-100" />

            <div className="space-y-6">
              {loading ? (
                <>
                  <MotivatingTextSkeleton />
                  <MotivatingTextSkeleton />
                </>
              ) : hasTexts ? (
                texts.map((text) => <MotivatingTextItem key={text.id} item={text} />)
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400">
                  <AlertCircle className="mb-2 size-8 opacity-50" />
                  <p className="text-sm">Nenhum texto motivador disponível.</p>
                </div>
              )}
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-3 flex items-center gap-2 text-slate-400">
                <Info className="size-4" />
                <h5 className="text-xs font-bold tracking-widest uppercase">Instruções</h5>
              </div>
              <ul className="list-inside list-disc space-y-2 text-sm text-slate-600 marker:text-slate-300">
                <li>Seu texto deve ter no mínimo 7 e no máximo 30 linhas.</li>
                <li>Cópia dos textos motivadores não são contabilizadas.</li>
                <li>Apresente uma proposta de intervenção.</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter
          className={`shrink-0 items-center gap-4 border-t border-slate-200 bg-white p-4 ${showStartButton ? "sm:justify-between" : "sm:justify-end"}`}
        >
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="rounded-full px-6 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Fechar
            </Button>
          </DialogClose>

          {showStartButton && (
            <Button
              asChild
              className="bg-primary h-12 w-full gap-4 rounded-2xl font-bold shadow-lg shadow-yellow-500/10"
            >
              <Link
                href={`/minhas-redacoes/nova-redacao?id=${topic.id}`}
                className="w-full sm:w-auto"
              >
                Iniciar Redação
                <NotebookPen className="size-4" />
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
