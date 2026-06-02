import { Search, ChevronDown, CalendarDays, X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { format, subDays, subMonths, subYears, isSameDay } from "date-fns";
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

export function TableFilterBar(props: TableFilterBarProps) {
  const {
    searchPlaceholder,
    searchTerm,
    onSearchChange,
    filters = [],
    dateRange,
    onDateRangeChange,
    theme = 'default',
  } = props;

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const hasActiveFilters =
    searchTerm !== "" ||
    (dateRange?.from !== undefined) ||
    filters.some((filter) => filter.value !== "");


  const countFilterItems = () => {
    const baseFiltersCount = 1 + filters.length;
    const hasDateRangeProp = 'dateRange' in props;

    return hasDateRangeProp ? baseFiltersCount + 1 : baseFiltersCount;
  };

  const totalFilters = countFilterItems();

  const handleClearFilters = () => {
    onSearchChange("");
    if (onDateRangeChange) onDateRangeChange(undefined);
    filters.forEach(filter => filter.onChange(""));
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
    <div className={`bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 flex gap-2 relative z-10 ${totalFilters > 2 ? 'flex-col' : 'flex-row'} md:flex-row`}>
      <div className="relative flex-1 min-w-0 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          suppressHydrationWarning
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 border-none outline-none placeholder:text-slate-400 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-hide max-w-full pb-1 lg:pb-0">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const selectedLabel = filter.options?.find(opt => opt.value === filter.value)?.label || filter.value;
          const hasSelection = filter.value != ""

          return (
            <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger
                className="min-h-12 w-auto flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 border border-transparent hover:border-slate-200 shadow-none data-[state=open]:bg-slate-100">
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

        {onDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                suppressHydrationWarning
                type="button"
                className="h-12 flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 border border-transparent hover:border-slate-200 outline-none">
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

              <div className="grid grid-cols-2 p-3 gap-2 justify-between border-b rounded-t-xl border-slate-100 bg-slate-50/50">
                {[
                  { label: "7 dias", getFrom: (hoje: Date) => subDays(hoje, 7) },
                  { label: "Mês passado", getFrom: (hoje: Date) => subMonths(hoje, 1) },
                  { label: "3 meses", getFrom: (hoje: Date) => subMonths(hoje, 3) },
                  { label: "6 meses", getFrom: (hoje: Date) => subMonths(hoje, 6) },
                  { label: "1 ano", getFrom: (hoje: Date) => subYears(hoje, 1) },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset.label, preset.getFrom)}
                    className={`flex-1 text-xs sm:text-sm font-medium border py-2 px-2 rounded-md text-center transition-colors whitespace-nowrap 
                      ${selectedPreset === preset.label ? 'bg-primary/5 text-primary border-primary hover:bg-primary/20 font-bold'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-primary/10 hover:border-primary'
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
    </div>
  );
}
