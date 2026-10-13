"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { TeacherChartData } from "@/types";
import { AlertCircle, BarChart2 } from "lucide-react";

interface ScoreDistributionChartProps {
  data: TeacherChartData[] | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    value: number;
    payload: TeacherChartData;
  }[];
}

export default function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  if (!data) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-4xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center shadow-sm md:p-8">
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-red-100/50 text-red-600">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="mb-2 text-xs font-black tracking-widest text-red-800 uppercase">
          Erro ao carregar gráfico
        </h3>
        <p className="max-w-xs text-sm text-slate-700">
          Não foi possível buscar a distribuição de notas no momento.
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-4xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center md:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
          <BarChart2 className="size-6" />
        </div>
        <h3 className="mb-2 text-xs font-black tracking-widest text-slate-500 uppercase">
          Gráfico Indisponível
        </h3>
        <p className="max-w-xs text-sm text-slate-400">
          Ainda não há volume de notas suficiente para gerar a distribuição estatística.
        </p>
      </div>
    );
  }

  const CustomBarTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0) {
      const currentItem = payload[0];
      if (!currentItem) return null;

      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <p className="mb-1 text-[10px] tracking-wider text-slate-400 uppercase">Faixa de Nota</p>
          <p className="text-base">{currentItem.payload.range} pontos</p>
          <div className="mt-2 border-t border-slate-700 pt-2">
            <p className="text-emerald-400">{currentItem.value} redações</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black tracking-wide uppercase">Distribuição de Notas</h3>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">
            Volume de redações por faixa de nota do ENEM
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-blue-600 uppercase">
          Geral
        </span>
      </div>

      <div className="mt-auto h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
              dy={10}
            />
            <Tooltip cursor={{ fill: "#f8fafc" }} content={<CustomBarTooltip />} />
            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
