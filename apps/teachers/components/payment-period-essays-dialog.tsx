"use client";

import type { GradedEssayListItem } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
import { Eye } from "lucide-react";
import GradedEssaysRow from "@/components/graded-essays-row";

export function PaymentPeriodEssaysDialog({ essays }: { essays: GradedEssayListItem[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 rounded-xl px-3 font-bold text-slate-600 hover:bg-primary/10 hover:text-slate-900"
          disabled={essays.length === 0}
        >
          <Eye className="size-4" />
          Ver redações do período
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] w-[95vw] max-w-6xl overflow-y-auto rounded-4xl border-none bg-white px-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6 text-left md:px-8 md:pt-8">
          <DialogTitle className="text-xl font-black tracking-tight md:text-2xl">
            Redações do período
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 overflow-hidden">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Aluno</div>
            <div className="col-span-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tema da redação</div>
            <div className="col-span-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Nota final</div>
            <div className="col-span-1 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Ação</div>
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
