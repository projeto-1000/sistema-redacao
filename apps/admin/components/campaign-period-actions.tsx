"use client";

import { exportFreeCorrectionCampaignCsv } from "@/app/actions/free-correction-campaign";
import { ExportCsvButton } from "@/components/export-csv-button";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

interface CampaignPeriodActionsProps {
  fromDate: string;
  toDate: string;
  fromIso: string;
  toIso: string;
}

function toLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function CampaignPeriodActions({
  fromDate,
  toDate,
  fromIso,
  toIso,
}: CampaignPeriodActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange>({
    from: toLocalDate(fromDate),
    to: toLocalDate(toDate),
  });

  const applyRange = (nextRange: DateRange) => {
    if (!nextRange.from || !nextRange.to) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", format(nextRange.from, "yyyy-MM-dd"));
    params.set("to", format(nextRange.to, "yyyy-MM-dd"));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const selectRange = (nextRange: DateRange | undefined) => {
    if (!nextRange) return;

    setRange(nextRange);
    applyRange(nextRange);
  };

  const applyPreset = (days: number) => {
    const today = new Date();
    const nextRange = { from: subDays(today, days - 1), to: today };

    setRange(nextRange);
    applyRange(nextRange);
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-between rounded-xl border-slate-200 bg-white font-bold text-slate-700 sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
              {format(toLocalDate(fromDate), "dd/MM/yyyy")} –{" "}
              {format(toLocalDate(toDate), "dd/MM/yyyy")}
            </span>
            <ChevronDown className="ml-2 size-4 text-slate-400" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg" align="end">
          <div className="flex gap-2 rounded-t-xl border-b border-slate-100 bg-slate-50/50 p-3">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => applyPreset(days)}
                className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
              >
                {days} dias
              </button>
            ))}
          </div>

          <div className="p-2">
            <Calendar
              mode="range"
              selected={range}
              onSelect={selectRange}
              locale={ptBR}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>

      <ExportCsvButton
        action={exportFreeCorrectionCampaignCsv}
        payload={{ from: fromIso, to: toIso }}
        fileName={`campanha_correcao_gratuita_${fromDate}_${toDate}`}
        className="w-full sm:w-auto"
      />
    </div>
  );
}
