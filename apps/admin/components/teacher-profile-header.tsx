
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Pencil, Lock, CreditCard, ChevronRight } from "lucide-react";

interface TeacherProfileHeaderProps {
  teacher: {
    name: string;
    id: string;
    status: string;
    registrationDate: string;
    email: string;
    avatarUrl: string;
  };
}

const STATUS_MAP = {
  active: { label: "Ativo", colors: "bg-emerald-50 text-emerald-600" },
  inactive: { label: "Inativo", colors: "bg-slate-100 text-slate-500" },
  blocked: { label: "Bloqueado", colors: "bg-red-50 text-red-600" },
}

export default function TeacherProfileHeader({ teacher }: TeacherProfileHeaderProps) {
  const currentStatus = STATUS_MAP[teacher.status as keyof typeof STATUS_MAP] || STATUS_MAP.inactive;

  return (
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <Avatar src={teacher.avatarUrl} name={teacher.name} className="size-20 rounded-full text-2xl" />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 leading-none">{teacher.name}</h1>
            <p className="text-sm font-medium text-slate-500">{teacher.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-bold pt-1">
              <span className="flex items-center text-slate-500">
                <Lock className="size-3.5 mr-1" /> ID: {teacher.id}
              </span>
              <span className="text-slate-300">|</span>
              <span className={`text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${currentStatus.colors}`}>
                {currentStatus.label}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Desde: {teacher.registrationDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-6 transition-colors">
            <Pencil className="size-4 mr-2" /> Editar Perfil
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500 font-bold px-6 transition-colors">
            <Lock className="size-4 mr-2" /> Bloquear
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-100 p-4 px-8">
        <button className="flex items-center justify-between w-full text-sm font-bold hover:text-blue-600 transition-colors group">
          <span className="flex items-center gap-2">
            <CreditCard className="size-4.5 text-slate-400 group-hover:text-blue-600" />
            Gerenciar Pagamentos e Faturas
          </span>
          <ChevronRight className="size-4.5 text-slate-400 group-hover:text-blue-600" />
        </button>
      </div>
    </div>
  )
}