"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@repo/ui/components/dialog";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { BookOpenText, FileText, Info, NotebookPen, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { EssayTopic, MotivationalText, EssayTopicDetail } from "@repo/types";
import { getTopicDetails } from "@/services/get-topics";
interface TopicDetailsDialogProps {
  topic: EssayTopic;
  children: React.ReactNode;
}

function MotivatingTextSkeleton() {
  return (
    <div className="mb-8 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <Skeleton className="h-5 w-20 rounded-md mb-3 bg-slate-200" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-slate-200" />
        <Skeleton className="h-4 w-[90%] bg-slate-200" />
      </div>
    </div>
  );
}

function MotivatingTextItem({ item }: { item: MotivationalText }) {
  return (
    <div className="mb-8 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <h4 className="font-bold text-xs uppercase tracking-widest mb-3 bg-[#EBC84C]/20 w-fit px-2 py-1 rounded-md text-[#8B781F]">
        Texto {item.text_number}
      </h4>
      <div className="space-y-4">
        {item.body_text && (
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
            {item.body_text}
          </div>
        )}
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={`Texto ${item.text_number}`}
            className="w-full h-auto object-contain max-h-[400px] rounded-lg bg-white border border-slate-200"
          />
        )}
        {item.source_reference && (
          <p className="text-[10px] text-slate-400 font-medium italic text-right mt-1">
            Fonte: {item.source_reference}
          </p>
        )}
      </div>
    </div>
  );
}

export function TopicDetailsDialog({ topic, children }: TopicDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<EssayTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && !details) {
      setLoading(true);
      getTopicDetails(topic.id)
        .then((data) => {
          setDetails(data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, topic.id, details]);

  const texts = details?.motivational_texts || [];
  const hasTexts = texts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-3xl border-0 outline-none focus:outline-none focus:ring-0 shadow-xl bg-white">

        <DialogHeader className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#EBC84C] p-2 rounded-lg shadow-sm shadow-yellow-200">
              <FileText className="size-5" />
            </div>
            <DialogTitle className="text-xl font-extrabold">
              Proposta de Redação
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 bg-white">
          <div className="p-6 md:p-8 md:mx-2">

            <div className="mb-8 p-6 bg-[#FFFDF5] border-l-4 border-[#EBC84C] rounded-r-2xl shadow-sm">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#8B781F] mb-3">
                Comando da Proposta
              </h5>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema:{" "}
                <span className="font-bold text-[#1E3A8A]">{`"${topic.title}"`}</span>.
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <BookOpenText className="size-5 text-[#1E3A8A]" />
              <h3 className="font-bold">Textos Motivadores</h3>
            </div>
            <hr className="border-slate-100 my-2 mb-4" />

            <div className="space-y-6">
              {loading ? (
                <>
                  <MotivatingTextSkeleton />
                  <MotivatingTextSkeleton />
                </>
              ) : hasTexts ? (
                texts.map((text) => (
                  <MotivatingTextItem key={text.id} item={text} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <AlertCircle className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum texto motivador disponível.</p>
                </div>
              )}
            </div>

            <div className="mt-10 p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 mb-3 text-slate-400">
                <Info className="size-4" />
                <h5 className="text-xs font-bold uppercase tracking-widest">Instruções</h5>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside marker:text-slate-300">
                <li>Seu texto deve ter no mínimo 7 e no máximo 30 linhas.</li>
                <li>Cópia dos textos motivadores não são contabilizadas.</li>
                <li>Apresente uma proposta de intervenção.</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-slate-200 bg-white sm:justify-between items-center gap-4 shrink-0">
          <DialogClose asChild>
            <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full px-6">
              Fechar
            </Button>
          </DialogClose>

          <Link href={`/minhas-redacoes/nova-redacao?id=${topic.id}`} className="w-full sm:w-auto">
            <Button className="w-full bg-primary font-bold rounded-full gap-4 h-12 shadow-lg shadow-yellow-500/10">
              Iniciar Redação
              <NotebookPen className="size-4" />
            </Button>
          </Link>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}