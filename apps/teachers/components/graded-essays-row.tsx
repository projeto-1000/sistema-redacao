'use client'

import { GradedEssayListItem } from "@repo/types"
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button"
import { formatDate } from "@repo/utils";
import { Eye } from "lucide-react"
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
        className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
      >
        <div className="lg:col-span-3 flex items-center gap-4">
          <Avatar src={essay.avatar_url} name={essay.student_name} className="size-9 rounded-full shrink-0 border border-slate-200" />
          <div>
            <h4 className="font-bold text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors">
              {essay.student_name}
            </h4>
            <span className="text-xs text-slate-500">
              Data de correção: {formatDate(essay.correction_date, 'numeric')}
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-5  mt-2 lg:mt-0">
          <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Tema
          </span>
          <p className="text-sm font-medium leading-snug line-clamp-2" title={essay.title}>
            {essay.title}
          </p>
        </div>

        <div className="lg:col-span-2 xl:col-span-3 flex lg:justify-center items-baseline lg:items-center gap-1">
          <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Nota:
          </span>
          <span className={`text-xl font-black tracking-tight ${getScoreColor(essay.total_score)}`}>
            {essay.total_score}
          </span>
          <span className="text-sm font-medium text-slate-400">
            / 1000
          </span>
        </div>

        <div className="lg:col-span-3 xl:col-span-1 flex justify-end">
          <Button asChild variant='outline'
            className="rounded-xl font-bold h-10"
          >
            <Link href={`/redacoes-corrigidas/${essay.id}`}>
              Ver correção <Eye className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}