"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Eye } from "lucide-react";
import { TeacherEssayListItem } from "@/types";

import TeacherEssaysRow from "@/components/teacher-essays-row";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useCallback } from "react";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface EssaysPeriodModalProps {
  teacherId: string;
  essays: TeacherEssayListItem[];
  totalPages: number;
}

export function EssaysPeriodModal({ essays, totalPages }: EssaysPeriodModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleOpenDetails = (id: string) => {
    startTransition(() => {
      const newQuery = createQueryString("essayId", id);
      router.push(`${pathname}?${newQuery}`, { scroll: false });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-primary/10 h-10 w-full rounded-xl px-3 font-bold text-slate-600 transition-colors hover:text-slate-900 sm:w-auto"
          disabled={essays.length === 0}
        >
          <Eye className="size-4" /> Ver redações do período
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-4xl border-none bg-white p-0 shadow-2xl sm:max-w-[95vw]">
        <DialogHeader className="shrink-0 p-6 pb-4 text-left md:p-8 md:pb-4">
          <DialogTitle className="text-xl font-black tracking-tight md:text-2xl">
            Redações no Período
          </DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar min-h-0 w-full flex-1 overflow-y-auto px-4">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-4 py-5 lg:grid">
            <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Aluno
            </div>
            <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Tema / Eixo
            </div>
            <div className="col-span-1 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Nota
            </div>
            <div className="col-span-2 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Status
            </div>
            <div className="col-span-1 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Prazo
            </div>
            <div className="col-span-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Correção
            </div>
            <div className="col-span-1 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Detalhes
            </div>
          </div>

          <div className="relative divide-y divide-slate-100 pb-6">
            {essays.map((essay) => (
              <TeacherEssaysRow key={essay.id} essay={essay} onViewDetails={handleOpenDetails} />
            ))}
          </div>

          <div
            className={`border-t border-slate-200 py-6 ${totalPages === 1 ? "hidden" : "block"}`}
          >
            <TablePagination totalPages={totalPages} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
