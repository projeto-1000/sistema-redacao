'use client'

import { ScrollArea } from "@repo/ui/components/scroll-area";
import { FileText } from "lucide-react";
import { EssayEditorForm } from "@/components/essay-editor-form";
import { MotivationalTexts } from "@/components/motivational-texts";
import { Button } from "@repo/ui/components/button";
import MobileMotivationalTexts from "@/components/mobile-motivational-texts";
import type { EssayTopicDetail } from "@repo/types";
import { useState } from "react";

type Props = {
  essayTopic: EssayTopicDetail;
};

export default function EssayPageClient({ essayTopic }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col max-w-full">
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

          <EssayEditorForm topic={essayTopic} />
        </div>
      </div>
      <MobileMotivationalTexts
        isOpen={isOpen}
        onClose={setIsOpen}
        topic={essayTopic}
      />
    </div>
  );
}
