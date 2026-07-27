import type {
  HistoryDisplayItem,
} from "@repo/types";
import { History } from "lucide-react";

import { TablePagination } from "../../table-pagination";
import { HistoryRow } from "./history-row";

interface HistoryError {
  message: string;
}

interface HistoryListData {
  items: HistoryDisplayItem[];
  totalPages: number;
  error: HistoryError | null;
}

interface HistoryListProps {
  data: HistoryListData;

  title?: string;
  description?: string;
  emptyMessage?: string;
}

export function HistoryList({
  data,
  title = "Histórico",
  description,
  emptyMessage = "Nenhuma movimentação encontrada.",
}: HistoryListProps) {
  const {
    items,
    totalPages,
    error,
  } = data;

  if (error) {
    return (
      <div className="rounded-4xl border border-red-100 bg-red-50 p-6 text-red-600 shadow-sm md:p-8">
        <h3 className="font-bold">
          Não foi possível carregar o histórico
        </h3>

        <p className="mt-1 text-sm">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-4 pt-6 md:pt-8">
        <div className="flex items-center gap-4 px-6 md:px-8">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <History className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">
              {title}
            </h2>

            {description && (
              <p className="text-sm font-medium text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col divide-y divide-slate-100 px-6 md:px-8">
          {items.length > 0 ? (
            items.map((item) => (
              <HistoryRow
                key={`${item.category}-${item.id}`}
                item={item}
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm font-medium text-slate-500">
              {emptyMessage}
            </p>
          )}
        </div>
      </div>

      {totalPages > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 py-4">
          <TablePagination
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}