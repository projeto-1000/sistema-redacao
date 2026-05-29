import { AlertCircle } from "lucide-react";
import { RETURN_REASON_LABELS } from "../../constants";

interface ReturnedEssayCardProps {
  reason: string;
  description?: string | null;
}

export default function ReturnedEssayCard({ reason, description }: ReturnedEssayCardProps) {

  const reasonLabel = RETURN_REASON_LABELS[reason] || reason;

  return (
    <div className="bg-red-50/50 p-6 rounded-3xl shadow-sm border border-red-100 flex flex-col gap-5">

      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="p-3 bg-white text-red-600 rounded-2xl">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg tracking-tight">
            Redação Devolvida
          </h3>
          <p className="text-sm font-medium text-slate-500">
            O crédito utilizado nessa correção foi devolvido.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Motivo da devolução
          </span>
          <p className="font-semibold text-slate-800 mt-1 text-[16px]">
            {reasonLabel}
          </p>
        </div>

        {description && description.trim() !== "" && (
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Observações do professor
            </span>
            <p className="font-semibold text-slate-800 mt-1 text-[16px]">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}