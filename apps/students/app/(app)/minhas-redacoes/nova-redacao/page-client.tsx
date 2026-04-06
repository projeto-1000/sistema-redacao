'use client'

import { ScrollArea } from "@repo/ui/components/scroll-area";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { EssayEditorForm } from "@/components/essay-editor-form";
import { MotivationalTexts } from "@/components/motivational-texts";
import { Button } from "@repo/ui/components/button";
import MobileMotivationalTexts from "@/components/mobile-motivational-texts";
import type { EssayTopicDetail } from "@repo/types";
import { useState } from "react";
import Link from "next/link";

type Props = {
  essayTopic: EssayTopicDetail;
};

export default function EssayPageClient({ essayTopic }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <div className={`h-[calc(100vh-8rem)] flex flex-col max-w-full  ${isSuccess ? 'justify-center' : 'justify-normal'}`}>
      {isSuccess ? (
        <div className="items-center flex flex-col">
          <div className="bg-green-100 p-6 rounded-full mb-4">
            <CheckCircle2 className="size-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-3">
            Redação enviada!
          </h2>
          <p className="text-slate-500 max-w-md leading-relaxed text-center">
            Sua redação sobre <span className="font-bold italic text-[#1E3A8A]">{`"${essayTopic.title}"`}</span> foi recebida e já está na fila de correção. Você receberá uma notificação assim que o professor finalizar.
          </p>
          <div className="flex flex-col sm:flex-row mt-8 gap-4 w-full sm:w-auto">
            <Button asChild variant="outline" className="h-12 rounded-full border-slate-300">
              <Link href="/inicio">Voltar ao Início</Link>
            </Button>
            <Button asChild className="h-12 rounded-full shadow-lg shadow-blue-600/20">
              <Link href="/minhas-redacoes">
                Ver minhas redações <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden gap-8">
            <div className="hidden lg:flex w-full lg:w-[450px] shrink-0 flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden h-full shadow-sm z-10">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-[#1E3A8A] shrink-0">
                <FileText className="size-4" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Proposta de Redação
                </h3>
              </div>
              <ScrollArea className="flex-1 w-full h-full bg-white">
                <MotivationalTexts topic={essayTopic} />
              </ScrollArea>
            </div>

            <div className="flex-1 h-full flex flex-col min-w-0">
              <Button
                onClick={() => setIsOpen(true)}
                className="flex lg:hidden mb-4 pt-4 pb-4 h-fit border border-slate-200 rounded-2xl bg-white hover:bg-slate-100"
              >
                <FileText className="size-7 bg-[#EBC84C] p-1 rounded-lg shadow-sm shadow-yellow-200 shrink-0" />
                Ver Proposta e textos motivadores
              </Button>

              <EssayEditorForm topic={essayTopic} onSuccess={() => setIsSuccess(true)} />
            </div>
          </div>
          <MobileMotivationalTexts
            isOpen={isOpen}
            onClose={setIsOpen}
            topic={essayTopic}
          />
        </>
      )}

      {/* <div className="flex-1 flex min-h-screen flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in-95 duration-500 shadow-sm">
        <div className="bg-green-50 p-6 rounded-full mb-6 ring-8 ring-green-50/50">
          <CheckCircle2 className="size-16 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold mb-3">
          Redação Enviada!
        </h2>
        <p className="text-slate-500 max-w-md mb-10 leading-relaxed">
          Recebemos seu texto com sucesso. Nossa equipe já vai começar a correção e você será notificado assim que estiver pronta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild variant="outline" className="h-12 px-8 rounded-full border-slate-300">
            <Link href="/dashboard">Voltar ao Início</Link>
          </Button>
          <Button asChild className="h-12 px-8 rounded-full gap-2 shadow-lg shadow-blue-600/20">
            <Link href="/minhas-redacoes">
              Ver minhas redações <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div> */}

    </div>
  );
}
