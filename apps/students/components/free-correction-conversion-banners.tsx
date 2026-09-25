"use client";

import {
  trackFreeCorrectionCampaignEvent,
  type FreeCorrectionCampaignPlacement,
} from "@/app/actions/free-correction-conversion";
import { Button } from "@repo/ui/components/button";
import { ArrowRight, Star, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef } from "react";

const PLANS_PATH = "/assinatura/planos";
const TRACKING_NAVIGATION_TIMEOUT_MS = 700;

function useCampaignImpression(essayId: string, placement: FreeCorrectionCampaignPlacement) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;

    hasTracked.current = true;

    void trackFreeCorrectionCampaignEvent({
      essayId,
      eventType: "impression",
      placement,
    });
  }, [essayId, placement]);
}

function useTrackedPlansNavigation(essayId: string, placement: FreeCorrectionCampaignPlacement) {
  const router = useRouter();

  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      void trackFreeCorrectionCampaignEvent({
        essayId,
        eventType: "click",
        placement,
      });

      return;
    }

    event.preventDefault();

    const trackingRequest = trackFreeCorrectionCampaignEvent({
      essayId,
      eventType: "click",
      placement,
    });
    const navigationTimeout = new Promise<void>((resolve) => {
      window.setTimeout(resolve, TRACKING_NAVIGATION_TIMEOUT_MS);
    });

    void Promise.race([trackingRequest, navigationTimeout]).finally(() => router.push(PLANS_PATH));
  };
}

export function FreeCorrectionScoreCard({
  essayId,
  totalScore,
}: {
  essayId: string;
  totalScore: number;
}) {
  const placement = "score_card";

  useCampaignImpression(essayId, placement);

  const handlePlansClick = useTrackedPlansNavigation(essayId, placement);

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
            <Link href={PLANS_PATH} onClick={handlePlansClick}>
              Ver planos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FreeCorrectionFooterBanner({ essayId }: { essayId: string }) {
  const placement = "footer_banner";

  useCampaignImpression(essayId, placement);

  const handlePlansClick = useTrackedPlansNavigation(essayId, placement);

  return (
    <section
      aria-labelledby="free-correction-conversion-title"
      className="relative rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-sm sm:px-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-12">
            <TrendingUp className="size-6" aria-hidden="true" />
          </div>

          <div>
            <h2
              id="free-correction-conversion-title"
              className="text-base leading-snug font-extrabold sm:text-lg"
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
          <Link href={PLANS_PATH} onClick={handlePlansClick}>
            Ver planos
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
