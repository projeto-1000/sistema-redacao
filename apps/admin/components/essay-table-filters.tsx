"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Calendar } from "@repo/ui/components/calendar";
import { useState } from "react";

export function EssayTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const currentStatus = searchParams.get("status") || "all";

  const currentUrlDate = searchParams.get("date");
  const selectedDate = currentUrlDate ? new Date(`${currentUrlDate}T12:00:00`) : undefined;

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDateSelect = (date: Date | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"));
    } else {
      params.delete("date");
    }

    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    setIsCalendarOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleDateSelect(undefined);
  };

  const adminCalendarClasses = {
    day: 'hover:bg-accent hover:text-accent-foreground',
    selected: 'rounded-md bg-secondary text-white',
    today: 'text-accent-foreground',
    focused: 'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50'
  }

  return (
    <div className="flex items-center gap-2">

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            <CalendarIcon className="size-4" />

            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Data"}

            {selectedDate ? (
              <X className="size-3 hover:text-red-500 transition-colors" onClick={clearDate} />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ptBR}
            classNames={adminCalendarClasses}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => handleStatusFilter("all")}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${currentStatus === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
        >
          Todos
        </button>
        <button
          onClick={() => handleStatusFilter("done")}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${currentStatus === "done" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
        >
          Corrigidos
        </button>
        <button
          onClick={() => handleStatusFilter("pending")}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${currentStatus === "pending" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
        >
          Pendentes
        </button>
      </div>

    </div>
  );
}