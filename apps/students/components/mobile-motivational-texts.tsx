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
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Textos Motivadores</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-150 overflow-y-auto px-4">
          <MotivationalTexts topic={topic} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
