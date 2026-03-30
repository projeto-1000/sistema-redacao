'use client'

import { updateTeacherStatus } from "@/app/action/get-teachers-data";
import { TeacherListItem } from "@/app/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { Eye, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { startTransition, useOptimistic } from "react";

const STATUS_MAP = {
  active: { label: "Ativo", colors: "bg-emerald-50 text-emerald-600" },
  inactive: { label: "Inativo", colors: "bg-slate-100 text-slate-500" },
  blocked: { label: "Bloqueado", colors: "bg-red-50 text-red-600" },
};

export function TeachersTableRow({ teacher }: { teacher: TeacherListItem }) {
  const [optimisticTeacher, setOptimisticTeacher] = useOptimistic(
    teacher,
    (state, newStatus: "active" | "inactive" | "blocked") => ({
      ...state,
      status: newStatus,
    })
  );

  const handleToggleStatus = () => {
    const newStatus = optimisticTeacher.status === "active" ? "blocked" : "active";

    startTransition(() => {
      setOptimisticTeacher(newStatus);
    });

    updateTeacherStatus(optimisticTeacher.id, optimisticTeacher.status).catch((err) => {
      console.error("Erro ao atualizar no banco", err);
    });
  };

  const currentStatus = STATUS_MAP[optimisticTeacher.status as keyof typeof STATUS_MAP] || STATUS_MAP.inactive;


  return (
    <div key={teacher.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:px-8 lg:py-4 items-center hover:bg-slate-50/50 transition-colors group">

      {/* Professor */}
      <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
        <Avatar src={teacher.avatar_url} name={teacher.full_name} className="size-10" />

        <span className="font-bold text-sm hover:underline cursor-pointer">{teacher.full_name}</span>
      </div>

      {/* E-mail */}
      <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</span>
        <span className="text-sm font-medium text-slate-500">{teacher.email}</span>
      </div>

      {/* Status */}
      <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${currentStatus.colors}`}>
          {currentStatus.label}
        </span>
      </div>

      {/* Corrigidas (Mês Atual) */}
      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mês Atual</span>
        <span className="text-base font-black text-blue-600">{teacher.currentMonth}</span>
      </div>

      {/* Corrigidas (Total) */}
      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
        <span className="text-base font-black">{teacher.total}</span>
      </div>

      {/* Ações */}
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
                  <Link href={`/professores/${optimisticTeacher.id}`}>
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
                  onClick={handleToggleStatus}
                >
                  {optimisticTeacher.status === "active" ? <UserX className="size-4.5" /> : <UserCheck className="size-4.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
                <p>{optimisticTeacher.status === "active" ? "Bloquear" : "Desbloquear"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

    </div>
  )
}