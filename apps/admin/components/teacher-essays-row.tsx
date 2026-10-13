"use client";

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

  const essayStatus =
    DELIVERY_STATUS_MAP[essay.status as keyof typeof DELIVERY_STATUS_MAP] ||
    DELIVERY_STATUS_MAP.correcting;

  const isCorrecting = essay.status === "correcting";

  const buttonContent = (
    <>
      <span className="mr-2 text-sm font-semibold lg:hidden">Ver Correção</span>
      <ArrowRight className="size-4" />
    </>
  );

  return (
    <div className="group grid grid-cols-1 items-center gap-4 py-4 transition-colors hover:bg-slate-50/50 lg:grid-cols-12 lg:px-4">
      <div className="col-span-1 flex items-center gap-3 lg:col-span-3">
        <Avatar src={essay.student_avatar} name={essay.student_name} className="size-10" />
        <div>
          <p className="cursor-pointer text-sm leading-tight font-bold text-blue-600 hover:underline">
            {essay.student_name}
          </p>
          <p className="text-[11px] font-medium text-slate-400">{essay.student_email}</p>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-3">
        <p className="truncate text-sm leading-snug font-bold" title={essay.title}>
          {essay.title}
        </p>
        <p className="mt-0.5 text-[10px] font-medium tracking-widest text-slate-400 uppercase">
          {essay.thematic_axis}
        </p>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-1 lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Nota
        </span>
        <span className="text-base font-black">{essay.total_score}</span>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-2 lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Status
        </span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${essayStatus.colors}`}
        >
          {essayStatus.label}
        </span>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-1 lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Entrega
        </span>
        {essay.status === "corrected" ? (
          essay.is_on_late ? (
            <AlertCircle className="size-6 rounded-full bg-red-50 p-1 text-red-500" />
          ) : (
            <CheckCircle2 className="size-6 rounded-full bg-emerald-50 p-1 text-emerald-600" />
          )
        ) : essay.status === "correcting" ? (
          <Clock className="size-6 animate-pulse rounded-full bg-slate-50 p-1 text-slate-300" />
        ) : (
          <div className="size-6 rounded-full border border-dashed border-slate-200 bg-slate-50" />
        )}
      </div>

      <div className="col-span-1 flex justify-between lg:col-span-1 lg:block">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Data
        </span>
        <span className="text-sm leading-tight font-medium">
          {formatDate(essay.correction_date, "numeric")}
        </span>
      </div>

      <div className="col-span-1 flex w-full justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onViewDetails && onViewDetails(essay.id)}
              asChild={!isCorrecting}
              disabled={isCorrecting}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-blue-600 transition-colors hover:bg-blue-100/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:h-8 lg:w-8 lg:rounded-full lg:p-0"
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

          <TooltipContent className="hidden rounded-lg border-none bg-slate-900 text-xs font-medium text-white lg:block">
            {isCorrecting ? "Correção em andamento" : "Ver Detalhes"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
