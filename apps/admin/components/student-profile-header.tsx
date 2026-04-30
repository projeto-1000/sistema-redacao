
import { Button } from "@repo/ui/components/button";
import { Avatar } from "@repo/ui/components/avatar";
import { Lock } from "lucide-react";
import { formatDate } from "@repo/utils";
import { USER_STATUS_MAP } from "@repo/constants";
import { StudentProfile } from "@repo/types";
import StudentSubscriptionCard from "./student-subscription-card";

interface StudentsProfileHeaderProps {
  student: StudentProfile
}

export function StudentProfileHeader({ student }: StudentsProfileHeaderProps) {

  const currentStatus = USER_STATUS_MAP[student.status as keyof typeof USER_STATUS_MAP] || USER_STATUS_MAP.inactive;

  return (
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <Avatar src={student.avatar_url} name={student.full_name}
            className="size-30! text-2xl border-3 border-slate-200 shadow-md" />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black leading-none">{student.full_name}</h1>
            <p className="text-sm font-medium text-slate-500">{student.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-bold pt-1">
              <span className="flex items-center text-slate-500">
                <Lock className="size-3.5 mr-1" /> ID: {student.id}
              </span>
              <span className="text-slate-300">|</span>
              <span className={`text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${currentStatus.colors}`}>
                {currentStatus.label}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Desde: {formatDate(student.created_at, 'numeric')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-6 transition-colors">
            <Pencil className="size-4 mr-2" /> Editar Perfil
          </Button> */}
          <Button
            variant="outline"
            className="flex-1 md:flex-none h-10 rounded-xl border-slate-200 hover:bg-red-50 hover:text-red-500 font-bold transition-colors">
            <Lock className="size-4 mr-2" /> Bloquear aluno
          </Button>
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      <StudentSubscriptionCard subscription={student.subscription} />
    </div>
  );
}