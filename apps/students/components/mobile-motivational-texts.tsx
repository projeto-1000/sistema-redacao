"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { MotivationalTexts } from "./motivational-texts";
import { EssayTopicDetail } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { FileText } from "lucide-react";
import { PrintTopicButton } from "@repo/ui/components/print-topic-button";

interface Props {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  topic: EssayTopicDetail;
}
export default function MobileMotivationalTexts({ isOpen, onClose, topic }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button className="mb-4 flex h-16 justify-start rounded-2xl border border-slate-200 bg-white pt-4 pb-4 text-[16px] font-bold text-slate-800 hover:bg-slate-100 lg:hidden">
          <div className="bg-primary flex shrink-0 items-center rounded-xl p-2 shadow-sm shadow-yellow-200">
            <FileText className="size-5" />
          </div>
          Ver textos motivadores
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="flex-row items-center justify-between gap-3 pr-8 text-left">
          <DialogTitle className="text-base">Textos Motivadores</DialogTitle>
          <PrintTopicButton topic={topic} />
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-150 min-h-0 overflow-y-auto px-4">
          <MotivationalTexts topic={topic} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
