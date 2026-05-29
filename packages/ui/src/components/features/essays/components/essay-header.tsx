import { cn } from "@repo/ui/lib/utils";
import { formatDate } from "@repo/utils";
import { Calendar, User, UserPen, UserX } from "lucide-react";

export type EssayStatus = 'draft' | 'pending' | 'correcting' | 'corrected' | 'returned';

interface EssayHeaderProps {
  title: string;
  teacherName?: string;
  date: string;
  studentName?: string;
  status?: EssayStatus;
  children?: React.ReactNode;
  className?: string;
}

export default function EssayHeader({
  title,
  teacherName,
  date,
  studentName,
  status,
  children,
  className
}: EssayHeaderProps) {


  const getDateLabel = () => {
    switch (status) {
      case "returned":
        return "Data da devolução";
      case "corrected":
        return "Data da correção";
      case "pending":
      case "correcting":
        return "Data de envio";
      default:
        return title.endsWith("Correção") ? "Data de envio" : "Data da correção";
    }
  };

  return (
    <div className={cn("flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10", className)}>
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <Calendar className="size-3.5 text-slate-400" />
            {getDateLabel()}: {formatDate(date, "short")}
          </div>

          {studentName && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="size-3.5 text-slate-400" />
              Enviada por: {studentName}
            </div>
          )}
        </div>


        {teacherName && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 w-fit rounded-full text-sm font-medium",
            status === "returned"
              ? "bg-red-50 text-red-700"
              : "bg-indigo-50 text-indigo-700"
          )}>
            {status === "returned" ? (
              <UserX className="size-3.5" />
            ) : (
              <UserPen className="size-3.5" />
            )}
            {status === "returned" ? "Devolvido por: " : "Corrigido por: "}
            {teacherName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 self-end lg:self-start">
        {children}
      </div>
    </div>
  );
}