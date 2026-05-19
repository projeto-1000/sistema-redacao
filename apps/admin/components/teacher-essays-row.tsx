'use client'

import { TeacherEssayListItem } from "@/types";
import { DELIVERY_STATUS_MAP } from "@repo/constants";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { formatDate } from "@repo/utils";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface TeacherEssaysRowProps {
  essay: TeacherEssayListItem;
  onViewDetails?: (id: string) => void;
}

export default function TeacherEssaysRow({ essay, onViewDetails }: TeacherEssaysRowProps) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.set("essayId", essay.id);

  const updatedHref = `?${params.toString()}`;

  const essayStatus = DELIVERY_STATUS_MAP[essay.status as keyof typeof DELIVERY_STATUS_MAP] || DELIVERY_STATUS_MAP.correcting

  const isCorrecting = essay.status === 'correcting';

  const buttonContent = (
    <>
      <span className="mr-2 text-sm font-semibold lg:hidden">Ver Correção</span>
      <ArrowRight className="size-4" />
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 lg:px-4 items-center hover:bg-slate-50/50 transition-colors group">

      <div className="col-span-1 lg:col-span-3 flex items-center gap-3">
        <Avatar src={essay.student_avatar} name={essay.student_name} className="size-10" />
        <div>
          <p className="font-bold text-sm text-blue-600 hover:underline cursor-pointer leading-tight">
            {essay.student_name}
          </p>
          <p className="text-[11px] font-medium text-slate-400">
            {essay.student_email}
          </p>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-3">
        <p className="font-bold text-sm leading-snug truncate" title={essay.title}>
          {essay.title}
        </p>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
          {essay.thematic_axis}
        </p>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota</span>
        <span className="text-base font-black">
          {essay.total_score}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${essayStatus.colors}`}>
          {essayStatus.label}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrega</span>
        {essay.status === "corrected" ? (
          essay.is_on_late ? (
            <AlertCircle className="size-6 text-red-500 bg-red-50 p-1 rounded-full" />
          ) : (
            <CheckCircle2 className="size-6 rounded-full p-1 bg-emerald-50 text-emerald-600" />
          )
        ) : essay.status === "correcting" ? (
          <Clock className="size-6 text-slate-300 bg-slate-50 p-1 rounded-full animate-pulse" />
        ) : (
          <div className="size-6 bg-slate-50 rounded-full border border-dashed border-slate-200" />
        )}
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-between lg:block">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
        <span className="text-sm leading-tight font-medium">
          {formatDate(essay.correction_date, 'numeric')}
        </span>
      </div>

      <div className="col-span-1 flex w-full justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onViewDetails && onViewDetails(essay.id)}
              asChild={!isCorrecting}
              disabled={isCorrecting}
              className="flex items-center justify-center border border-slate-200 bg-slate-50/80 text-blue-600 hover:bg-blue-100/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full h-10 px-4 rounded-xl sm:w-auto lg:w-8 lg:h-8 lg:p-0 lg:rounded-full 
        "
            >
              {isCorrecting ? (
                buttonContent
              ) : (
                <Link href={updatedHref} scroll={false}>
                  {buttonContent}
                </Link>
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent className="hidden lg:block bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
            {isCorrecting ? 'Correção em andamento' : 'Ver Detalhes'}
          </TooltipContent>
        </Tooltip>
      </div>

    </div>
  )
}