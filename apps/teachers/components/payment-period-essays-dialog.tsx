"use client";

import type { GradedEssayListItem } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Eye } from "lucide-react";
import GradedEssaysRow from "@/components/graded-essays-row";

export function PaymentPeriodEssaysDialog({ essays }: { essays: GradedEssayListItem[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="hover:bg-primary/10 h-10 rounded-xl px-3 font-bold text-slate-600 hover:text-slate-900"
          disabled={essays.length === 0}
        >
          <Eye className="size-4" />
          Ver redações do período
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-4xl border-none bg-white p-0 shadow-2xl sm:max-w-6xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 text-left md:px-8 md:pt-8">
          <DialogTitle className="text-xl font-black tracking-tight md:text-2xl">
            Redações do período
          </DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
            <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Aluno
            </div>
            <div className="col-span-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Tema da redação
            </div>
            <div className="col-span-3 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Nota final
            </div>
            <div className="col-span-1 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Ação
            </div>
          </div>

          <div className="divide-y divide-slate-100 pb-4">
            {essays.map((essay) => (
              <GradedEssaysRow key={essay.id} essay={essay} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
