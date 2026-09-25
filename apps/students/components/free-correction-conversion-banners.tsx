"use client";

import { Button } from "@repo/ui/components/button";
import { ArrowRight, Star, TrendingUp, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PLANS_PATH = "/assinatura/planos";

export function FreeCorrectionScoreCard({ totalScore }: { totalScore: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 text-white shadow-lg sm:p-8">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Star className="size-20" aria-hidden="true" />
      </div>

      <div className="relative">
        <p className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
          Nota total
        </p>

        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-extrabold text-[#EBC84C]">{totalScore}</span>
          <span className="text-xl font-medium text-slate-400">/ 1000</span>
        </div>

        <div className="mt-6 border-t border-slate-600/70 pt-5">
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 size-5 shrink-0 text-[#FACC15]" aria-hidden="true" />

            <div>
              <p className="text-sm leading-snug font-extrabold text-white sm:text-base">
                Cada correção é um passo pra sua nota subir.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
                Continue treinando.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full rounded-xl bg-[#FACC15] font-extrabold text-slate-950 shadow-none hover:bg-[#EAB308]"
            asChild
          >
            <Link href={PLANS_PATH}>
              Ver planos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FreeCorrectionFooterBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <section
      aria-labelledby="free-correction-conversion-title"
      className="relative rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-sm sm:px-6"
    >
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Fechar convite para conhecer os planos"
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none sm:top-1/2 sm:right-4 sm:-translate-y-1/2"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <div className="flex flex-col gap-5 pr-8 sm:flex-row sm:items-center sm:gap-5 sm:pr-14">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-12">
            <TrendingUp className="size-6" aria-hidden="true" />
          </div>

          <div>
            <h2
              id="free-correction-conversion-title"
              className="text-base leading-snug font-extrabold text-slate-900 sm:text-lg"
            >
              A nota muda quando o treino continua
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-emerald-700">
              Melhorar exige repetição. Toque pra continuar treinando.
            </p>
          </div>
        </div>

        <Button
          className="w-full shrink-0 rounded-xl bg-emerald-600 px-6 font-bold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
          asChild
        >
          <Link href={PLANS_PATH}>
            Ver planos
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
