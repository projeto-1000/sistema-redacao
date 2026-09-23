"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";

function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function PaymentMonthFilterContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("month") ?? monthValue(new Date());
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);

    return {
      value: monthValue(date),
      label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date),
      isCurrent: index === 0,
    };
  });

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    params.delete("page");
    params.delete("essayId");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center">
      <span className="ml-2 shrink-0 text-xs font-bold uppercase tracking-widest text-slate-400">
        Ciclo de faturamento:
      </span>

      <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 xl:w-auto xl:justify-end xl:pb-0">
        {months.map((month) => (
          <button
            key={month.value}
            type="button"
            onClick={() => select(month.value)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-5 py-2.5 text-xs font-bold capitalize transition-colors",
              current === month.value
                ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:bg-primary/10 hover:text-slate-800",
            )}
          >
            {month.label}
            {month.isCurrent && " (Atual)"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PaymentMonthFilter() {
  return (
    <Suspense fallback={<div className="h-[74px] w-full animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />}>
      <PaymentMonthFilterContent />
    </Suspense>
  );
}
