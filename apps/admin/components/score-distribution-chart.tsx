"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { TeacherChartData } from "@/types";

interface ScoreDistributionChartProps {
  data: TeacherChartData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    value: number;
    payload: TeacherChartData;
  }[];
}

export default function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {

  const CustomBarTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0) {

      const currentItem = payload[0];
      if (!currentItem) return null;

      return (
        <div className="bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-slate-700">
          <p className="text-slate-400 mb-1 text-[10px] uppercase tracking-wider">Faixa de Nota</p>
          <p className="text-base">{currentItem.payload.range} pontos</p>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-emerald-400">{currentItem.value} redações</p>
          </div>
        </div>
      );
    }
    return null;
  };
  return (
    <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide">
            Distribuição de Notas
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            Volume de redações por faixa de nota do ENEM
          </p>
        </div>
        <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
          Geral
        </span>
      </div>

      <div className="h-48 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
              dy={10}
            />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomBarTooltip />} />
            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}