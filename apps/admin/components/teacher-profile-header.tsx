'use client'

import { updateTeacherStatus } from "@/app/actions/teachers";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { USER_STATUS_MAP } from "@repo/constants";
import { TeacherProfile } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";
import { Lock, CreditCard, ChevronRight, UserCheck, UserLock, UserPen } from "lucide-react";
interface TeacherProfileHeaderProps {
  teacher: TeacherProfile
}

export default function TeacherProfileHeader({ teacher }: TeacherProfileHeaderProps) {
  const { entity: teacherItem, toggleStatus } = useToggleUserStatus(
    teacher,
    updateTeacherStatus
  );

  const currentStatus = USER_STATUS_MAP[teacherItem.status as keyof typeof USER_STATUS_MAP] || USER_STATUS_MAP.inactive;

  return (
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <Avatar src={teacherItem.avatar_url} name={teacherItem.full_name} className="size-30! text-2xl border-3 border-slate-200 shadow-md" />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black leading-none">{teacherItem.full_name}</h1>
            <p className="text-sm font-medium text-slate-500">{teacherItem.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-bold pt-1">
              <span className="flex items-center text-slate-500">
                <Lock className="size-3.5 mr-1" /> ID: {teacherItem.id}
              </span>
              <span className="text-slate-300">|</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${currentStatus.colors}`}>
                {currentStatus.label}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Desde: {formatDate(teacherItem.created_at, 'numeric')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="secondary" className="flex-1 md:flex-none h-10 rounded-xl font-medium transition-colors">
            <UserPen className="size-4 mr-2" /> Editar Perfil
          </Button>
          <Button
            onClick={toggleStatus}
            variant="outline"
            className={`flex-1 md:flex-none h-10 rounded-xl border-slate-200 font-medium transition-colors ${teacherItem.status === 'active' ? 'hover:bg-red-100 hover:text-red-500' : 'hover: bg-green-100 hover:text-green-600'}`}>

            {teacherItem.status === "active" ?
              <>
                <UserLock className="size-4.5" /> Bloquear
              </>
              :
              <>
                <UserCheck className="size-4.5" /> Desbloquear
              </>
            }
          </Button>
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      <div className=" bg-slate-100 p-4 px-8">
        <button className="flex items-center justify-between w-full text-sm font-bold hover:text-blue-600 transition-colors group">
          <span className="flex items-center gap-2">
            <CreditCard className="size-4.5 text-slate-400 group-hover:text-blue-600" />
            Gerenciar Pagamentos e Faturas
          </span>
          <ChevronRight className="size-4.5 text-slate-400 group-hover:text-blue-600" />
        </button>
      </div>
    </div >
  )
}