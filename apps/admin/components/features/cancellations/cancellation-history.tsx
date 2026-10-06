"use client";

import type { CancellationHistoryEntry } from "@/types/cancellation-history";
import { useCancellationHistoryFilters } from "@/hooks/use-cancellation-history-filters";
import { Accordion } from "@repo/ui/components/accordion";
import { TableFilterBar } from "@repo/ui/components/table-filter-bar";
import { CancellationStudentRow } from "./cancellation-student-row";

export function CancellationHistory({ entries }: { entries: CancellationHistoryEntry[] }) {
  const { searchTerm, setSearchTerm, filterOptions, groups } =
    useCancellationHistoryFilters(entries);
  return (
    <div className="space-y-4">
      <TableFilterBar
        theme="admin"
        searchPlaceholder="Buscar por nome, e-mail ou ID..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
      />
      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Nenhuma solicitação encontrada.
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {groups.map((group) => (
            <CancellationStudentRow key={group.studentId} group={group} />
          ))}
        </Accordion>
      )}
    </div>
  );
}
