"use client";

import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";

interface EvolutionData {
  month: string;
  score: number;
}

interface EvolutionGraphProps {
  data: EvolutionData[];
}

export function EvolutionGraph({ data }: EvolutionGraphProps) {
  const [timeRange, setTimeRange] = useState<"3M" | "6M">("3M");

  const displayData = timeRange === "3M" ? data.slice(-3) : data;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex justify-end gap-2">
        {["3 Meses", "6 Meses"].map((label) => {
          const value = label.startsWith("3") ? "3M" : "6M";
          const isActive = timeRange === value;
          return (
            <button
              key={value}
              onClick={() => setTimeRange(value as "3M" | "6M")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              } `}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="-ml-4 h-[200px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={displayData}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.5}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
              dy={10}
              padding={{ left: 15, right: 15 }}
            />

            <Tooltip
              cursor={{ stroke: "var(--color-muted)", strokeWidth: 2 }}
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />

            <Line
              name="Nota média"
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--secondary))"
              strokeWidth={4}
              dot={{
                r: 6,
                fill: "hsl(var(--secondary))",
                stroke: "#fff",
                strokeWidth: 3,
              }}
              activeDot={{
                r: 8,
                fill: "hsl(var(--secondary))",
                stroke: "#fff",
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
