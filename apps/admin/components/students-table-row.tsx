"use client";

import { Eye, UserX, UserCheck, User, Bot } from "lucide-react";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { updateStudentStatus } from "@/app/action/students";
import Link from "next/link";
import { StudentsListItem } from "@/types";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { USER_STATUS_MAP } from "@repo/constants";

export function StudentsTableRow({ student }: { student: StudentsListItem }) {
  const { entity: studentItem, toggleStatus } = useToggleUserStatus(
    student,
    updateStudentStatus
  );

  const currentStatus = USER_STATUS_MAP[studentItem.status as keyof typeof USER_STATUS_MAP] || USER_STATUS_MAP.inactive;

  return (

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">

      <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
        <Avatar src={studentItem.avatar_url} name={studentItem.full_name} className="size-10" />
        <div>
          <p className="font-bold text-sm leading-tight">{studentItem.full_name}</p>
          <p className="text-xs text-slate-500">{studentItem.email}</p>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-1 flex flex-row lg:flex-col items-center justify-between lg:justify-center mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${currentStatus.colors}`}>
          {currentStatus.label}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-2 flex flex-row lg:flex-col items-center justify-between lg:justify-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</span>
        <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${studentItem.plan === "Premium" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
          {studentItem.plan || 'Basic'}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-2 flex flex-row lg:flex-col items-center justify-between lg:justify-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Créditos</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
            <User className="size-3.5" />
            <span className="text-[11px] font-bold">{studentItem.creditsProf || '0'} <span className="text-[9px] font-semibold opacity-70">PROF.</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
            <Bot className="size-3.5" />
            <span className="text-[11px] font-bold">{studentItem.creditsIA || '0'} <span className="text-[9px] font-semibold opacity-70">IA</span></span>
          </div>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-2 flex flex-row lg:flex-col items-center justify-between lg:justify-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vigência</span>
        <div className="text-right lg:text-left">
          <p className="text-sm font-bold text-slate-700">
            {studentItem.validityStart || '10/11/2023'} - {studentItem.validityEnd || '10/11/2024'}
          </p>
          <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${studentItem.validityType === "EXPIRADO" ? "text-red-500" : "text-slate-400"}`}>
            {studentItem.validityType || 'MANUAL'}
          </p>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-end pt-4 lg:pt-0 mt-2 lg:mt-0 border-t border-slate-100 lg:border-t-0">
        <div className="flex items-center gap-1">

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                asChild
              >
                <Link href={`/alunos/${studentItem.id}`}>
                  <Eye className="size-4.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
              <p>Ver Detalhes</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={toggleStatus}
              >
                {studentItem.status === "active" ? <UserX className="size-4.5" /> : <UserCheck className="size-4.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
              <p>{studentItem.status === "active" ? "Bloquear" : "Ativar"}</p>
            </TooltipContent>
          </Tooltip>

        </div>
      </div>

    </div>
  );
}