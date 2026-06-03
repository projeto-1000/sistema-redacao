"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
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
  const [isPending, startTransition] = useTransition();

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
        <Button variant="outline" className="w-full h-12 rounded-xl text-blue-600 hover:bg-blue-50! font-bold transition-colors" disabled={essays.length === 0}>
          <Eye className="size-4 mr-2" /> Ver redações do período
        </Button>
      </DialogTrigger>

      <DialogContent className="min-w-[95%] px-4 overflow-y-scroll max-h-[90%] rounded-4xl border-none shadow-2xl bg-white">
        <DialogHeader className="p-6 md:p-8 pb-0 text-left">
          <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">
            Redações no Período
          </DialogTitle>
        </DialogHeader>

        <div className="w-full">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-5 border-b border-slate-100">
            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</div>
            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tema / Eixo</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Nota</div>
            <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Prazo</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correção</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Detalhes</div>
          </div>

          <div className="divide-y divide-slate-100 pb-6 relative">
            {essays.map((essay) => (
              <TeacherEssaysRow key={essay.id} essay={essay} onViewDetails={handleOpenDetails} />
            ))}
          </div>

          <div className={`pt-6 border-t border-slate-200 ${totalPages === 1 ? 'hidden' : 'block'}`}>
            <TablePagination totalPages={totalPages} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}