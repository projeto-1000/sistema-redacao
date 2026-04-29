import { formatDate } from "@repo/utils";
import { Calendar, User, UserPen } from "lucide-react";

interface EssayHeaderProps {
  title: string;
  teacherName?: string;
  date: string;
  studentName?: string;
  children?: React.ReactNode;
}

//TODO: melhorar aqui
export default function EssayHeader({ title, teacherName, date, studentName, children }: EssayHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <Calendar className="size-3.5 text-slate-400" />
            Data da correção: {formatDate(date, 'short')}
          </div>

          {studentName && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="size-3.5 text-slate-400" />
              Enviada por: {studentName}
            </div>
          )}

        </div>

        {teacherName && (
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 w-fit rounded-full text-sm font-medium">
            <UserPen className="size-3.5" />
            Corrigido por: {teacherName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 self-end lg:self-start">
        {children}
      </div>
    </div>
  )
}