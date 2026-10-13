"use client";

import { useState, useTransition } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { getWeeklyVolumeData } from "@/app/actions/get-weekly-volume-data";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

interface ChartData {
  name: string;
  sent: number;
  corrected: number;
}

interface EssayVolumeChartProps {
  initialData: ChartData[];
}

export default function EssayVolumeChart({ initialData }: EssayVolumeChartProps) {
  const [data, setData] = useState<ChartData[]>(initialData);
  const [weeksAgo, setWeeksAgo] = useState("0");
  const [isPending, startTransition] = useTransition();

  const weekOptions = [
    { value: "0", label: "Semana atual" },
    { value: "1", label: "Semana anterior" },
    { value: "2", label: "2 semanas atrás" },
    { value: "3", label: "3 semanas atrás" },
    { value: "4", label: "4 semanas atrás" },
  ];

  const handleWeekChange = (value: string) => {
    setWeeksAgo(value);
    startTransition(async () => {
      const newData = await getWeeklyVolumeData(Number(value));
      setData(newData);
    });
  };

  return (
    <div className="relative flex min-h-100 flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black">Volume de Redações</h3>
            {isPending && <Loader2 className="text-primary size-4 animate-spin" />}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Comparativo semanal de envios vs. correções finalizadas
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <div className="flex items-center gap-1.5">
              <span className="bg-secondary size-2.5 rounded-full" /> Enviadas
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-primary size-2.5 rounded-full" /> Corrigidas
            </div>
          </div>

          <Select value={weeksAgo} onValueChange={handleWeekChange} disabled={isPending}>
            <SelectTrigger className="h-9 w-42.5 rounded-lg border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 shadow-sm transition-colors outline-none focus:ring-2 focus:ring-blue-500/50">
              <SelectValue placeholder="Selecione a semana" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
              {weekOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer text-sm font-medium text-slate-700 focus:bg-blue-50 focus:text-blue-700"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 h-75 w-full">
        {!data || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
            Sem dados para exibir nesta semana.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }}
                dy={10}
                interval={0}
                padding={{ left: 15, right: 15 }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ fontWeight: "bold" }}
              />

              <Line
                type="monotone"
                name="Enviadas"
                dataKey="sent"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
              />

              <Line
                type="monotone"
                name="Corrigidas"
                dataKey="corrected"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#fbbf24", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
