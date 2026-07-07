'use client'

import { GradedEssayListItem } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button"
import { getScoreColor } from "@repo/ui/components/features/constants";
import { formatDate } from "@repo/utils";
import { Eye } from "lucide-react"
import Link from "next/link";

interface GradedEssaysRowProps {
  essay: GradedEssayListItem;
}

export default function GradedEssaysRow({ essay }: GradedEssaysRowProps) {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4 px-4 sm:px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
    >

      <div className="lg:col-span-3 flex items-center gap-4">
        <Avatar src={essay.avatar_url} name={essay.student_name} className="size-9 rounded-full shrink-0 border border-slate-200" />
        <div className="min-w-0">
          <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors truncate">
            {essay.student_name}
          </h4>
          <span className="text-xs text-slate-500 block truncate">
            Data da correção: {formatDate(essay.correction_date, 'numeric')}
          </span>
        </div>
      </div>


      <div className="lg:col-span-3 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Tema
        </span>
        <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.title}>
          {essay.title}
        </p>
      </div>

      <div className="lg:col-span-2 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Corretor
        </span>
        <div className="flex items-center gap-2">

          <span className="text-sm font-medium text-slate-700 truncate">
            {essay.teacher_name}
          </span>
        </div>
      </div>

      <div className="lg:col-span-2 flex items-baseline  lg:justify-start gap-1 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">
          Nota:
        </span>
        <span className={`text-xl font-black tracking-tight ${getScoreColor(essay.total_score)}`}>
          {essay.total_score}
        </span>
        <span className="text-sm font-medium text-slate-400">
          / 1000
        </span>
      </div>

      <div className="lg:col-span-2 flex lg:justify-end mt-2 lg:mt-0">
        <Button asChild variant='outline' className="rounded-xl font-bold h-10 w-full lg:w-fit">
          <Link href={`/redacoes-corrigidas/${essay.id}`}>
            Ver Correção <Eye className="size-4 ml-1" />
          </Link>
        </Button>
      </div>

    </div>
  )
}