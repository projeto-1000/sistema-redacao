"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronDown, CircleDashed, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Calendar } from "@repo/ui/components/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import { DateRange } from "react-day-picker";

export function EssayTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateRange: DateRange | undefined =
    from && to
      ? {
          from: new Date(`${from}T12:00:00`),
          to: new Date(`${to}T12:00:00`),
        }
      : undefined;

  const currentStatus = searchParams.get("status") || "all";
  const hasFilters = currentStatus !== "all" || !!from || !!to;

  const formatDisplayDate = () => {
    if (!dateRange?.from) return "";
    if (!dateRange.to) return format(dateRange.from, "dd/MM");
    return `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`;
  };

  const updateQueryParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });

    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleStatusFilter = (status: string) => {
    updateQueryParams({ status: status === "all" ? null : status });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    updateQueryParams({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
    });

    if (range?.from && range?.to) setIsCalendarOpen(false);
  };

  const setPreset = (days: number) => {
    const today = new Date();
    handleDateRangeSelect({
      from: subDays(today, days),
      to: today,
    });
  };

  const clearAllFilters = () => {
    updateQueryParams({ status: null, from: null, to: null });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentStatus} onValueChange={handleStatusFilter}>
        <SelectTrigger className="h-9 w-fit rounded-lg border-slate-200 bg-white text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <CircleDashed className="size-3.5 text-slate-400" />
            <SelectValue placeholder="Status" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-sm font-medium">
            Todos os status
          </SelectItem>
          <SelectItem value="pending" className="text-sm font-medium text-yellow-600">
            Pendentes
          </SelectItem>
          <SelectItem value="correcting" className="text-sm font-medium text-blue-600">
            Em Correção
          </SelectItem>
          <SelectItem value="corrected" className="text-sm font-medium text-emerald-600">
            Corrigidos
          </SelectItem>
          <SelectItem value="returned" className="text-sm font-medium text-red-600">
            Devolvidas
          </SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold whitespace-nowrap text-slate-600 transition-colors outline-none hover:bg-slate-50">
            <CalendarDays className="size-4 text-slate-400" />
            <span
              className={`text-xs font-bold tracking-wider text-slate-400 uppercase ${!dateRange ? "flex" : "hidden lg:block"}`}
            >
              Data:
            </span>

            <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
              {dateRange && <p>{formatDisplayDate()}</p>}
              <ChevronDown className="ml-1 size-3.5 text-slate-400" />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg" align="end">
          <div className="flex flex-wrap justify-between gap-2 rounded-t-xl border-b border-slate-100 bg-slate-50/50 p-3">
            {[
              { label: "7 dias", value: 7 },
              { label: "30 dias", value: 30 },
              { label: "90 dias", value: 90 },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => setPreset(preset.value)}
                className="flex-1 rounded-md border border-slate-200 bg-white py-2 text-center text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="p-2">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              locale={ptBR}
              autoFocus
            />
          </div>
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-9 gap-2 px-2 text-xs font-bold text-slate-400 transition-colors hover:text-red-500"
        >
          <RotateCcw className="size-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
