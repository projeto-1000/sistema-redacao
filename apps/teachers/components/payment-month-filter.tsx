"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function PaymentMonthFilter() {
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
    };
  });

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {months.map((month) => (
        <button
          key={month.value}
          type="button"
          onClick={() => select(month.value)}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold capitalize transition-colors ${current === month.value ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
        >
          {month.label}
        </button>
      ))}
    </div>
  );
}
