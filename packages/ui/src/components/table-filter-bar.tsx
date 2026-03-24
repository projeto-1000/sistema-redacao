import { Search, ChevronDown, CalendarDays, X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Calendar } from "@repo/ui/components/calendar";
import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";


export interface FilterOption {
  id: string;
  label: string;
  value: string;
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
  theme?: "default" | "admin";
}

export function TableFilterBar({
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  filters = [],
  dateRange,
  onDateRangeChange,
  theme = 'default',
}: TableFilterBarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const hasActiveFilters =
    searchTerm !== "" ||
    (dateRange?.from !== undefined) ||
    filters.some((filter) => filter.value !== "");

  const handleClearFilters = () => {
    onSearchChange("");
    if (onDateRangeChange) onDateRangeChange(undefined);
    filters.forEach(filter => filter.onChange(""));
    setSelectedDay(null);
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


  const setPreset = (days: number) => {
    setSelectedDay(days);
    const today = new Date();

    if (onDateRangeChange) {
      onDateRangeChange({
        from: subDays(today, days),
        to: today,
      });
    }
    setCurrentMonth(today);
  };

  const adminCalendarClasses = {
    day: 'hover:bg-accent hover:text-accent-foreground',
    range_start: 'rounded-md rounded-l-md bg-secondary text-white',
    range_middle: 'rounded-none bg-accent text-accent-foreground',
    range_end: 'bg-secondary rounded-md rounded-r-md text-white',
    today: 'text-accent-foreground',
    focused: 'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50'
  }

  //TODO: configurar default classes
  const defaultCalendarClasses = {}

  return (
    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 flex items-center gap-2 relative z-10" >

      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 transition-all"

        />

      </div>

      <div className="flex items-center gap-2 w-auto" >
        {filters.map((filter) => {
          const Icon = filter.icon;
          const selectedLabel = filter.options?.find(opt => opt.value === filter.value)?.label || filter.value;
          const hasSelection = filter.value != ""

          return (
            <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger
                className="min-h-12 w-auto flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 border border-transparent hover:border-slate-200 shadow-none data-[state=open]:bg-slate-100 focus-visible:ring-offset-0 outline-o focus-visible:border-none focus-visible:ring-blue-600">
                <Icon className="size-3.5 text-slate-400" />

                <span className={`text-xs font-bold text-slate-400 uppercase tracking-wider ${hasSelection ? 'hidden lg:block' : 'flex'}`}>
                  {filter.label}:
                </span>

                <SelectValue>
                  <span className="text-xs font-bold text-slate-700 items-center uppercase">
                    {selectedLabel}
                  </span>
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="rounded-xl border-slate-200 shadow-sm">
                {filter.options?.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="font-medium text-slate-700 cursor-pointer rounded-lg focus:bg-slate-100"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>

            </Select>
          );
        })}
      </div>

      {onDateRangeChange && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-12 flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 border border-transparent hover:border-slate-200 outline-none">
              <CalendarDays className="size-3.5 text-slate-400" />
              <span className={`text-xs font-bold text-slate-400 uppercase tracking-wider ${dateRange === undefined ? 'flex' : 'hidden lg:block'}`}>
                Data:
              </span>

              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <p className={dateRange === undefined ? 'hidden' : 'flex'}>
                  {formatDisplayDate()}
                </p>
                <ChevronDown className="size-3.5 text-slate-400 ml-1" />
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0 shadow-lg rounded-xl border-slate-200" align="end">

            <div className="flex flex-wrap p-3 gap-2 justify-between border-b rounded-t-xl border-slate-100 bg-slate-50/50">
              {[
                { label: "7 dias", value: 7 },
                { label: "30 dias", value: 30 },
                { label: "60 dias", value: 60 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setPreset(preset.value)}
                  className={`flex-1 text-sm font-medium border py-2 rounded-md text-center transition-colors ${selectedDay === preset.value
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="p-2">
              <Calendar
                mode="range"
                selected={dateRange}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                onSelect={(range) => {
                  setSelectedDay(null);
                  if (onDateRangeChange) onDateRangeChange(range);
                }}
                locale={ptBR}
                resetOnSelect
                classNames={theme === "admin" ? adminCalendarClasses : defaultCalendarClasses}
              />
            </div>
          </PopoverContent>
        </Popover>
      )}

      {hasActiveFilters && (
        <>
          <div className="hidden lg:block w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleClearFilters}
                className=" h-12 px-3 bg-red-50 hover:bg-red-100/80 transition-colors rounded-lg flex items-center justify-center shrink-0"
              >
                <X className="size-4 text-red-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white font-medium text-xs rounded-lg border-none">
              <p>Limpar filtros</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}
