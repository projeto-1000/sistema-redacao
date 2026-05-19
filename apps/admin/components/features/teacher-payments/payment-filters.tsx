"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@repo/ui/lib/utils";

function FiltersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentMonthParam = searchParams.get("month");

  const recentMonths = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(startOfMonth(new Date()), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM", { locale: ptBR }),
      year: format(date, "yyyy"),
      isCurrent: i === 0,
    };
  });

  const activeMonth = currentMonthParam || (recentMonths[0]?.value ?? "");

  useEffect(() => {
    if (!currentMonthParam && recentMonths[0]) {
      handleSelectMonth(recentMonths[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectMonth = (monthValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col xl:flex-row xl:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm justify-between">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 ml-2">
        Ciclo de Faturamento:
      </span>

      <div className="flex items-center gap-2 overflow-x-auto w-fit pb-2 xl:pb-0">
        {recentMonths.map((m) => (
          <button
            key={m.value}
            onClick={() => handleSelectMonth(m.value)}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors capitalize",
              activeMonth === m.value
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            {m.label} {m.year} {m.isCurrent && " (Atual)"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PaymentFilters() {
  return (
    <Suspense fallback={
      <div className="h-16 w-full animate-pulse bg-slate-50 border border-slate-100 rounded-2xl mb-8" />
    }>
      <FiltersContent />
    </Suspense>
  );
}