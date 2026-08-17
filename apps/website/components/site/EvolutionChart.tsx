"use client";

import { useEffect, useRef, useState } from "react";

const notas = [600, 680, 720, 760, 720, 840];
const labels = ["Redação 1", "R.2", "R.3", "R.4", "R.5", "R.6"];
const seletor = ["Nota geral", "C1", "C2", "C3", "C4", "C5"];

const W = 520;
const H = 220;
const PAD_X = 40;
const PAD_Y = 30;

/**
 * Snapshot animado do dashboard: evolução da nota geral,
 * com seletor de competências e resumo numérico.
 */
export function EvolutionChart() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setInView(true),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const min = 560;
  const max = 900;
  const pts = notas.map((n, i) => {
    const x = PAD_X + (i * (W - PAD_X * 2)) / (notas.length - 1);
    const y = PAD_Y + ((max - n) / (max - min)) * (H - PAD_Y * 2);
    return { x, y, n };
  });
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const firstPoint = pts[0]!;
  const lastPoint = pts[pts.length - 1]!;
  const areaPath = `${linePath} L${lastPoint.x},${H - PAD_Y} L${firstPoint.x},${H - PAD_Y} Z`;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
    >
      {/* Header do dashboard */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Dashboard · Evolução
          </p>
          <p className="mt-1 font-display text-lg font-bold text-foreground">
            Evolução da nota geral
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-foreground">
            Nota geral
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full"
        aria-label="Gráfico de evolução da nota geral"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid horizontal */}
        {[0.25, 0.5, 0.75].map((f) => {
          const y = PAD_Y + f * (H - PAD_Y * 2);
          return (
            <line
              key={f}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeDasharray="4 6"
            />
          );
        })}

        {/* Área */}
        <path
          d={areaPath}
          fill="url(#areaFill)"
          style={{
            opacity: inView ? 1 : 0,
            transition: "opacity 900ms ease 400ms",
          }}
        />

        {/* Linha */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: inView ? 0 : 1,
            transition: "stroke-dashoffset 1400ms cubic-bezier(0.22,1,0.36,1)",
            filter:
              "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 40%, transparent))",
          }}
        />

        {/* Pontos + valores */}
        {pts.map((p, i) => (
          <g
            key={i}
            style={{
              opacity: inView ? 1 : 0,
              transition: `opacity 400ms ease ${800 + i * 140}ms, transform 400ms ease ${800 + i * 140}ms`,
              transformOrigin: `${p.x}px ${p.y}px`,
              transform: inView ? "scale(1)" : "scale(0.4)",
            }}
          >
            <circle cx={p.x} cy={p.y} r={5} fill="var(--primary)" />
            <circle
              cx={p.x}
              cy={p.y}
              r={9}
              fill="var(--primary)"
              fillOpacity={0.25}
            />
            <text
              x={p.x}
              y={p.y - 14}
              textAnchor="middle"
              className="font-display"
              fontSize="13"
              fontWeight="800"
              fill="currentColor"
            >
              {p.n}
            </text>
          </g>
        ))}

        {/* Labels eixo X */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            fillOpacity={0.55}
          >
            {labels[i]}
          </text>
        ))}
      </svg>

      {/* Seletor de competências (mockup) */}
      <div
        aria-hidden
        className="mt-4 flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-secondary p-1.5"
      >
        {seletor.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              i === 0
                ? "bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgba(25,96,234,0.9)]"
                : "text-muted-foreground"
            }`}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Resumo */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Última
          </p>
          <p className="mt-1 font-display text-2xl font-black text-primary">
            960
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Média geral
          </p>
          <p className="mt-1 font-display text-2xl font-black text-foreground">
            720
          </p>
        </div>
      </div>
    </div>
  );
}
