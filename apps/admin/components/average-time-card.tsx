"use client";

import { useState, useEffect } from "react";
import { Zap, AlertCircle, History } from "lucide-react";
import { AverageTimeRange } from "@/types";
import { getAverageTime } from "@/app/actions/teachers";

interface AverageTimeCardProps {
  teacherId: string;
}

export default function AverageTimeCard({ teacherId }: AverageTimeCardProps) {
  const [timeRange, setTimeRange] = useState<AverageTimeRange>("current_month");
  const [avgTime, setAvgTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTime() {
      setLoading(true);
      const time = await getAverageTime(teacherId, timeRange);
      setAvgTime(time);
      setLoading(false);
    }
    fetchTime();
  }, [timeRange, teacherId]);

  const renderContent = () => {
    if (loading) {
      return <div className="h-full w-full animate-pulse rounded-3xl bg-slate-100" />;
    }

    if (avgTime === null) {
      return (
        <div className="flex flex-col items-center justify-between p-6 text-center">
          <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-red-100/50 text-red-600">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="mb-2 text-xs font-black tracking-widest text-red-800 uppercase">
            Erro ao carregar tempo médio
          </h3>
          <p className="max-w-xs text-sm text-slate-700">
            Falha ao buscar o tempo médio das correções do professor.
          </p>
        </div>
      );
    }

    if (avgTime === 0) {
      return (
        <div className="flex h-full min-h-55 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-all">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
            <History className="size-6 text-slate-400" />
          </div>
          <h3 className="mb-2 text-[11px] font-black tracking-widest text-slate-500 uppercase">
            Sem atividade no período
          </h3>
          <p className="max-w-45 text-xs leading-relaxed font-medium text-slate-400">
            Não identificamos correções finalizadas para o período selecionado.
          </p>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 scale-[1.8] rounded-full bg-blue-50 opacity-60 blur-2xl" />
        <div className="relative flex flex-col items-center">
          <span className="text-[5rem] leading-none font-black tracking-tighter">
            {avgTime}
            <span className="ml-1 text-2xl font-bold text-slate-300">min</span>
          </span>
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-emerald-600">
            <Zap className="size-4 fill-emerald-600" />
            <span className="text-[10px] font-black tracking-widest uppercase">
              {avgTime < 15
                ? "Leitura Rápida"
                : avgTime > 30
                  ? "Leitura Detalhada"
                  : "Ritmo Padrão"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const isError = avgTime === null && !loading;

  return (
    <div className="flex h-full min-h-95 flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black tracking-wide uppercase">Tempo médio</h3>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">Média por redação</p>
        </div>

        <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner">
          {["current_month", "30d", "60d", "90d"].map((val) => (
            <button
              key={val}
              disabled={loading || isError}
              onClick={() => setTimeRange(val as AverageTimeRange)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${timeRange === val
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {val === "current_month" ? "Mês Atual" : val}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">{renderContent()}</div>
    </div>
  );
}
