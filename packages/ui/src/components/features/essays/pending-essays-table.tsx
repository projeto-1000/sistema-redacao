import { PENDING_ESSAYS_TABLE_GRID } from "./pending-essay-row";
import Link from "next/link";
import type { ReactNode } from "react";

interface PendingEssaysTableProps {
  children: ReactNode;
  heading?: string;
  viewAllHref?: string;
}

export function PendingEssaysTable({
  children,
  heading,
  viewAllHref,
}: PendingEssaysTableProps) {
  const hasHeading = Boolean(heading && viewAllHref);

  return (
    <div className="mt-8 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
      {heading && viewAllHref && (
        <div className="flex items-center justify-between p-8">
          <h3 className="text-lg font-bold">{heading}</h3>
          <Link
            href={viewAllHref}
            className="text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
          >
            Ver fila completa
          </Link>
        </div>
      )}

      <div
        className={`hidden border-b border-slate-100 px-8 lg:grid lg:gap-4 ${PENDING_ESSAYS_TABLE_GRID} ${
          hasHeading ? "bg-transparent pb-5" : "bg-slate-50/50 py-5"
        }`}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Aluno
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Tema da redação
        </div>
        <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Prazo
        </div>
        <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Ação
        </div>
      </div>

      {children}
    </div>
  );
}
