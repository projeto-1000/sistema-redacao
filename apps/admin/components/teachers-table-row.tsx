"use client";

import { updateTeacherStatus } from "@/app/actions/teachers";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { TeacherListItem } from "@/types";
import { USER_STATUS_MAP } from "@repo/constants";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Eye, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

export function TeachersTableRow({ teacher }: { teacher: TeacherListItem }) {
  const { entity: teacherItem, toggleStatus } = useToggleUserStatus(teacher, updateTeacherStatus);

  const currentStatus =
    USER_STATUS_MAP[teacherItem.status as keyof typeof USER_STATUS_MAP] || USER_STATUS_MAP.inactive;

  return (
    <div
      key={teacherItem.id}
      className="group grid grid-cols-1 items-center gap-4 p-5 transition-colors hover:bg-slate-50/50 lg:grid-cols-12 lg:px-8 lg:py-4"
    >
      <div className="col-span-1 flex items-center gap-4 lg:col-span-4">
        <Avatar src={teacherItem.avatar_url} name={teacherItem.full_name} className="size-10" />
        <Link
          href={`/professores/${teacherItem.id}`}
          className="rounded-sm text-sm font-bold transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:outline-none"
        >
          {teacherItem.full_name}
        </Link>
      </div>

      <div className="col-span-1 flex justify-between lg:col-span-3 lg:block">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          E-mail
        </span>
        <span className="text-sm font-medium text-slate-500">{teacherItem.email}</span>
      </div>

      <div className="col-span-1 flex justify-between lg:col-span-2 lg:block">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Status
        </span>
        <span
          className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${currentStatus.colors}`}
        >
          {currentStatus.label}
        </span>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-1 lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Mês Atual
        </span>
        <span className="text-base font-black text-blue-600">{teacherItem.currentMonth}</span>
      </div>

      <div className="col-span-1 flex items-center justify-between lg:col-span-1 lg:justify-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:hidden">
          Total
        </span>
        <span className="text-base font-black">{teacherItem.total}</span>
      </div>

      <div className="col-span-1 mt-2 flex justify-end border-t border-slate-100 pt-4 lg:col-span-1 lg:mt-0 lg:border-t-0 lg:pt-0">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <Link href={`/professores/${teacherItem.id}`}>
                    <Eye className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
                <p>Ver Detalhes</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={toggleStatus}
                >
                  {teacherItem.status === "active" ? (
                    <UserX className="size-4.5" />
                  ) : (
                    <UserCheck className="size-4.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
                <p>{teacherItem.status === "active" ? "Bloquear" : "Desbloquear"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
