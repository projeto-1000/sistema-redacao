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
  SelectValue
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
    <div className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-200 min-h-[400px] flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">

        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900">Volume de Redações</h3>
            {isPending && <Loader2 className="size-4 text-primary animate-spin" />}
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">Comparativo semanal de envios vs. correções finalizadas</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-secondary" /> Enviadas</div>
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Corrigidas</div>
          </div>


          <Select
            value={weeksAgo}
            onValueChange={handleWeekChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-[170px] h-9 bg-slate-50 border-slate-200 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none rounded-lg shadow-sm transition-colors">
              <SelectValue placeholder="Selecione a semana" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 rounded-xl shadow-lg">
              {weekOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-sm font-medium text-slate-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <div className="w-full h-[300px] mt-4">
        {(!data || data.length === 0) ? (
          <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">
            Sem dados para exibir nesta semana.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                dy={10}
                interval={0}
                padding={{ left: 15, right: 15 }}
              />

              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
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