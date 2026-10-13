import { Search, ChevronDown, CalendarDays, X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { format, subDays, subMonths, subYears, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Calendar } from "@repo/ui/components/calendar";
import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Input } from "./input";
import { Button } from "./button";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  defaultValue?: string;
  icon: LucideIcon;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  theme?: "default" | "admin";
}

interface TableFilterBarProps {
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  dateRange?: DateRange;
  onDateRangeChange?: (date: DateRange | undefined) => void;
  dateFilterLabel?: string;
  theme?: "default" | "admin";
}

export function TableFilterBar(props: TableFilterBarProps) {
  const {
    searchPlaceholder,
    searchTerm,
    onSearchChange,
    filters = [],
    dateRange,
    onDateRangeChange,
    dateFilterLabel = "Data",
  } = props;

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const hasActiveFilters =
    searchTerm !== "" ||
    dateRange?.from !== undefined ||
    filters.some((filter) => filter.value !== (filter.defaultValue ?? ""));

  const countFilterItems = () => {
    const baseFiltersCount = 1 + filters.length;
    const hasDateRangeProp = "dateRange" in props;

    return hasDateRangeProp ? baseFiltersCount + 1 : baseFiltersCount;
  };

  const totalFilters = countFilterItems();

  const handleClearFilters = () => {
    onSearchChange("");
    if (onDateRangeChange) onDateRangeChange(undefined);
    filters.forEach((filter) => filter.onChange(filter.defaultValue ?? ""));
    setSelectedPreset(null); // Atualizado aqui
  };

  const formatDisplayDate = () => {
    if (dateRange?.from) {
      if (dateRange.to) {
        if (isSameDay(dateRange.from, dateRange.to)) {
          return format(dateRange.from, "dd/MM", { locale: ptBR });
        }
        return `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`;
      }
      return format(dateRange.from, "dd/MM", { locale: ptBR });
    }
    return "Selecione";
  };

  const handlePresetClick = (label: string, getFromDate: (hoje: Date) => Date) => {
    const today = new Date();
    setSelectedPreset(label);

    if (onDateRangeChange) {
      onDateRangeChange({
        from: getFromDate(today),
        to: today,
      });
    }
    setCurrentMonth(today);
  };

  return (
    <div
      className={`relative z-10 mb-8 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm ${totalFilters > 2 ? "flex-col" : "flex-row"} md:flex-row`}
    >
      <div className="relative w-full min-w-0 flex-1">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          suppressHydrationWarning
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 w-full rounded-xl border-none bg-slate-50 pr-4 pl-11 text-sm font-medium text-slate-700 transition-all outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="no-scrollbar flex max-w-full shrink-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const selectedLabel =
            filter.options?.find((opt) => opt.value === filter.value)?.label || filter.value;
          const hasSelection = filter.value !== (filter.defaultValue ?? "");

          return (
            <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="flex min-h-12 w-auto shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-slate-50 p-2 shadow-none transition-colors hover:border-slate-200 hover:bg-slate-100 data-[state=open]:bg-slate-100">
                <Icon className="size-3.5 text-slate-400" />

                <span
                  className={`text-xs font-bold tracking-wider text-slate-400 uppercase ${hasSelection ? "hidden lg:block" : "flex"}`}
                >
                  {filter.label}:
                </span>

                <SelectValue>
                  <span className="items-center text-xs font-bold text-slate-700 uppercase">
                    {selectedLabel}
                  </span>
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="rounded-xl border-slate-200 shadow-sm">
                {filter.options?.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer rounded-lg font-medium text-slate-700 focus:bg-slate-100"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {onDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                suppressHydrationWarning
                type="button"
                className="flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-slate-50 p-2 transition-colors outline-none hover:border-slate-200 hover:bg-slate-100"
              >
                <CalendarDays className="size-3.5 text-slate-400" />
                <span
                  className={`text-xs font-bold tracking-wider text-slate-400 uppercase ${dateRange === undefined ? "flex" : "hidden lg:block"}`}
                >
                  {dateFilterLabel}:
                </span>

                <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <p className={dateRange === undefined ? "hidden" : "flex"}>
                    {formatDisplayDate()}
                  </p>
                  <ChevronDown className="ml-1 size-3.5 text-slate-400" />
                </span>
              </button>
            </PopoverTrigger>

            <PopoverContent
              className="w-auto rounded-xl border-slate-200 p-0 shadow-lg"
              align="end"
            >
              <p className="mt-3 ml-3 text-[13px] text-slate-600">Filtrar por período:</p>
              <div className="grid grid-cols-3 justify-between gap-2 rounded-t-xl border-b border-slate-100 bg-slate-50/50 p-3">
                {[
                  { label: "7 dias", getFrom: (today: Date) => subDays(today, 6) },
                  { label: "14 dias", getFrom: (today: Date) => subDays(today, 13) },
                  { label: "1 mês", getFrom: (today: Date) => addDays(subMonths(today, 1), 1) },
                  { label: "3 meses", getFrom: (today: Date) => addDays(subMonths(today, 3), 1) },
                  { label: "6 meses", getFrom: (today: Date) => addDays(subMonths(today, 6), 1) },
                  { label: "1 ano", getFrom: (today: Date) => addDays(subYears(today, 1), 1) },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset.label, preset.getFrom)}
                    className={`flex-1 rounded-md border px-2 py-2 text-center text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
                      selectedPreset === preset.label
                        ? "bg-primary/5 text-primary border-primary hover:bg-primary/20 font-bold"
                        : "hover:bg-primary/10 hover:border-primary border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="p-2">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  onSelect={(range) => {
                    setSelectedPreset(null);
                    if (onDateRangeChange) onDateRangeChange(range);
                  }}
                  locale={ptBR}
                />
              </div>
            </PopoverContent>
          </Popover>
        )}

        {hasActiveFilters && (
          <>
            <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 lg:block"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClearFilters}
                  className="flex h-12 shrink-0 items-center justify-center rounded-lg bg-red-50 px-3 transition-colors hover:bg-red-100/80"
                >
                  <X className="size-4 text-red-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-none bg-slate-900 text-xs font-medium text-white">
                <p>Limpar filtros</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
