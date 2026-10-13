"use client";

import { GradedEssayListItem } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { getScoreColor } from "@repo/ui/components/features/constants";
import { formatDate } from "@repo/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

interface GradedEssaysRowProps {
  essay: GradedEssayListItem;
}

export default function GradedEssaysRow({ essay }: GradedEssaysRowProps) {
  return (
    <div className="group grid grid-cols-1 items-center gap-2 px-4 py-5 transition-colors hover:bg-slate-50 sm:gap-3 sm:px-8 lg:grid-cols-12 lg:gap-4">
      <div className="flex items-center gap-4 lg:col-span-3">
        <Avatar
          src={essay.avatar_url}
          name={essay.student_name}
          className="size-9 shrink-0 rounded-full border border-slate-200"
        />
        <div className="min-w-0">
          <h4 className="truncate text-sm leading-snug font-bold transition-colors group-hover:text-[#1E3A8A]">
            {essay.student_name}
          </h4>
          <span className="block truncate text-xs text-slate-500">
            Data da correção: {formatDate(essay.correction_date, "numeric")}
          </span>
        </div>
      </div>

      <div className="mt-2 lg:col-span-3 lg:mt-0">
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Tema
        </span>
        <p className="line-clamp-2 text-sm leading-snug font-medium" title={essay.title}>
          {essay.title}
        </p>
      </div>

      <div className="mt-2 lg:col-span-2 lg:mt-0">
        <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Corretor
        </span>
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-700">{essay.teacher_name}</span>
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1 lg:col-span-2 lg:mt-0 lg:justify-start">
        <span className="mr-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Nota:
        </span>
        <span className={`text-xl font-black tracking-tight ${getScoreColor(essay.total_score)}`}>
          {essay.total_score}
        </span>
        <span className="text-sm font-medium text-slate-400">/ 1000</span>
      </div>

      <div className="mt-2 flex lg:col-span-2 lg:mt-0 lg:justify-end">
        <Button asChild variant="outline" className="h-10 w-full rounded-xl font-bold lg:w-fit">
          <Link href={`/redacoes-corrigidas/${essay.id}`}>
            Ver Correção <Eye className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
