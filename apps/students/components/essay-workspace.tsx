"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { EssayEditorForm } from "@/components/essay-editor-form";
import { MotivationalTexts } from "@/components/motivational-texts";
import MobileMotivationalTexts from "@/components/mobile-motivational-texts";
import type { EssayTopicDetail } from "@repo/types";
import type { EssayDraft } from "@/types";

interface EssayWorkspaceProps {
  essayTopic: EssayTopicDetail;
  backup: EssayDraft | null;
  preferInitialBackup?: boolean;
  hasAvailableCredits: boolean;
}

export function EssayWorkspace({
  essayTopic,
  backup,
  preferInitialBackup = false,
  hasAvailableCredits,
}: EssayWorkspaceProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="animate-in fade-in flex h-[calc(100vh-8rem)] max-w-full flex-col justify-normal duration-500">
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden lg:flex-row">
        <div className="z-10 hidden h-full w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:flex lg:w-[450px]">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-slate-50/50 p-5 text-[#1E3A8A]">
            <FileText className="size-4" />
            <h3 className="text-sm font-bold tracking-wide uppercase">Proposta de Redação</h3>
          </div>
          <ScrollArea className="h-full w-full flex-1 bg-white">
            <MotivationalTexts topic={essayTopic} />
          </ScrollArea>
        </div>

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <MobileMotivationalTexts isOpen={isOpen} onClose={setIsOpen} topic={essayTopic} />

          <EssayEditorForm
            topic={essayTopic}
            backup={backup}
            preferInitialBackup={preferInitialBackup}
            hasAvailableCredits={hasAvailableCredits}
          />
        </div>
      </div>
    </div>
  );
}
