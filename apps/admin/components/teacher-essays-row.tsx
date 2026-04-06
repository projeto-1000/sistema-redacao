import { TeacherEssayListItem } from "@/app/types";
import { Avatar } from "@repo/ui/components/avatar";
import { formatDate } from "@repo/utils";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const STATUS_MAP = {
  done: { label: "Corrigida", colors: 'text-emerald-600 bg-emerald-50' },
  returned: { label: "Devolvida", colors: 'text-amber-600 bg-amber-50' },
  'under_correction': { label: "Em correção", colors: 'text-blue-600 bg-blue-50' },
}

export default function TeacherEssaysRow({ essay }: { essay: TeacherEssayListItem }) {

  const essayStatus = STATUS_MAP[essay.status as keyof typeof STATUS_MAP] || STATUS_MAP.under_correction

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 lg:px-4 items-center hover:bg-slate-50/50 transition-colors group">

      {/* Aluno */}
      <div className="col-span-1 lg:col-span-3 flex items-center gap-3">
        <Avatar src={essay.avatar_url} name={essay.student_name} className="size-10" />
        <div>
          <p className="font-bold text-sm text-blue-600 hover:underline cursor-pointer leading-tight">
            {essay.student_name}
          </p>
          <p className="text-[11px] font-medium text-slate-400">
            {essay.email}
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

      {/* Nota */}
      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota</span>
        <span className="text-base font-black">
          {essay.total_score}
        </span>
      </div>

      {/* Status */}
      <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${essayStatus.colors}`}>
          {essayStatus.label}
        </span>
      </div>

      {/* Entrega */}
      <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrega</span>
        {essay.is_on_late ? (
          <AlertCircle className="size-6 text-red-500 bg-red-50 p-1 rounded-full" />

        ) : (
          <CheckCircle2 className="size-6 rounded-full p-1 bg-emerald-50 text-emerald-500" />
        )}
      </div>

      {/* Data */}
      <div className="col-span-1 lg:col-span-1 flex justify-between lg:block">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
        <span className="text-sm leading-tight font-medium">
          {formatDate(essay.correction_date, 'numeric')}
        </span>
      </div>

      {/* Ações */}
      <div className="col-span-1 lg:col-span-1 flex justify-end">
        <button className="size-8 rounded-full border border-slate-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors">
          <ArrowRight className="size-4" />
        </button>
      </div>

    </div>
  )
}