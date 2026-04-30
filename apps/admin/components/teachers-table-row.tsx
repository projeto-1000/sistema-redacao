'use client'

import { updateTeacherStatus } from "@/app/actions/teachers";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { TeacherListItem } from "@/types";
import { USER_STATUS_MAP } from "@repo/constants";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { Eye, UserCheck, UserX } from "lucide-react";
import Link from "next/link";


export function TeachersTableRow({ teacher }: { teacher: TeacherListItem }) {
  const { entity: teacherItem, toggleStatus } = useToggleUserStatus(
    teacher,
    updateTeacherStatus
  );

  const currentStatus = USER_STATUS_MAP[teacherItem.status as keyof typeof USER_STATUS_MAP] || USER_STATUS_MAP.inactive;

  return (
    <div key={teacherItem.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">

      <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
        <Avatar src={teacherItem.avatar_url} name={teacherItem.full_name} className="size-10" />
        <span className="font-bold text-sm hover:underline cursor-pointer">
          {teacherItem.full_name}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</span>
        <span className="text-sm font-medium text-slate-500">{teacherItem.email}</span>
      </div>

      <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${currentStatus.colors}`}>
          {currentStatus.label}
        </span>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mês Atual</span>
        <span className="text-base font-black text-blue-600">{teacherItem.currentMonth}</span>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
        <span className="text-base font-black">{teacherItem.total}</span>
      </div>

      <div className="col-span-1 lg:col-span-1 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"

                >
                  <Link href={`/professores/${teacherItem.id}`}>
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
                  className="h-9 w-9 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  onClick={toggleStatus}
                >
                  {teacherItem.status === "active" ? <UserX className="size-4.5" /> : <UserCheck className="size-4.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                <p>{teacherItem.status === "active" ? "Bloquear" : "Desbloquear"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

    </div>
  )
}