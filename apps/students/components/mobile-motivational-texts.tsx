'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
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
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogTrigger asChild>
        <Button className="flex lg:hidden mb-4 pt-4 pb-4 h-16 text-[16px] border border-slate-200 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold justify-start">
          <div className="flex items-center rounded-xl bg-primary p-2 shadow-sm shadow-yellow-200 shrink-0">
            <FileText className="size-5 text-slate-900" />
          </div>
          Ver textos motivadores

        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Textos Motivadores</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[600px] overflow-y-auto px-4">
          <MotivationalTexts topic={topic} />
        </div>
      </DialogContent>
    </Dialog>
  )
}