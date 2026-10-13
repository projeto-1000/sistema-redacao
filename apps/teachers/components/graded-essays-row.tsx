"use client";

import { GradedEssayListItem } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

interface GradedEssaysRowProps {
  essay: GradedEssayListItem;
}

export default function GradedEssaysRow({ essay }: GradedEssaysRowProps) {
  const getScoreColor = (score: number) => {
    if (score >= 900) return "text-green-600";
    if (score >= 700) return "text-blue-600";
    if (score >= 500) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <div className="divide-y divide-slate-100">
      <div
        key={essay.id}
        className="group grid grid-cols-1 items-center gap-2 px-8 py-5 transition-colors hover:bg-slate-50 lg:grid-cols-12 lg:gap-4"
      >
        <div className="flex min-w-0 items-center gap-4 lg:col-span-3">
          <Avatar
            src={essay.avatar_url}
            name={essay.student_name}
            className="size-9 shrink-0 rounded-full border border-slate-200"
          />
          <div className="min-w-0">
            <h4 className="truncate text-sm leading-snug font-bold transition-colors group-hover:text-[#1E3A8A]">
              {essay.student_name}
            </h4>
            <span className="text-xs text-slate-500">
              Data de correção: {formatDate(essay.correction_date, "numeric")}
            </span>
          </div>
        </div>

        <div className="mt-2 min-w-0 lg:col-span-4 lg:mt-0 xl:col-span-5">
          <span className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
            Tema
          </span>
          <p className="line-clamp-2 text-sm leading-snug font-medium" title={essay.title}>
            {essay.title}
          </p>
        </div>

        <div className="flex items-baseline gap-1 lg:col-span-2 lg:items-center lg:justify-center xl:col-span-3">
          <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
            Nota:
          </span>
          <span className={`text-xl font-black tracking-tight ${getScoreColor(essay.total_score)}`}>
            {essay.total_score}
          </span>
          <span className="text-sm font-medium text-slate-400">/ 1000</span>
        </div>

        <div className="flex justify-end lg:col-span-3 xl:col-span-1">
          <Button asChild variant="outline" className="h-10 rounded-xl font-bold whitespace-nowrap">
            <Link href={`/redacoes-corrigidas/${essay.id}`}>
              Ver correção <Eye className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
