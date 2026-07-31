import type { StudentCreditSummary } from "@/types/credits";
import { Button } from "@repo/ui/components/button";
import { Coins, Plus } from "lucide-react";
import Link from "next/link";

interface CreditsCardProps {
  credits: StudentCreditSummary;
}

const CREDIT_TYPES = [
  {
    key: "plan",
    label: "Plano",
    dotClassName: "bg-blue-500",
  },
  {
    key: "extra",
    label: "Extras",
    dotClassName: "bg-violet-500",
  },
  {
    key: "free",
    label: "Gratuito",
    dotClassName: "bg-amber-400",
  },
  {
    key: "mentorship",
    label: "Mentoria",
    dotClassName: "bg-emerald-500",
  },
] as const;

export function CreditsCard({
  credits,
}: CreditsCardProps) {
  const availableCredits = CREDIT_TYPES.filter(
    ({ key }) => credits[key] > 0
  );

  const hasCredits = credits.total > 0;

  return (
    <div className="flex w-fit items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:w-auto md:gap-6">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="rounded-xl bg-[#FFF9E6] p-2.5 text-[#EBC84C]">
          <Coins className="size-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none font-extrabold tracking-tight text-slate-900">
              {credits.total}
            </span>

            <div className="flex flex-col justify-center">
              <span className="text-[10px] leading-none font-bold tracking-wider text-slate-400 uppercase">
                {credits.total === 1
                  ? "Crédito"
                  : "Créditos"}
              </span>

              <span className="mt-1 text-[10px] leading-none font-bold tracking-wider text-slate-400 uppercase">
                {credits.total === 1
                  ? "Disponível"
                  : "Disponíveis"}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {hasCredits ? (
              availableCredits.map(
                ({ key, label, dotClassName }) => (
                  <div
                    key={key}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${dotClassName}`}
                    />

                    <span className="text-xs font-medium whitespace-nowrap text-slate-500">
                      {label}: {credits[key]}
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-200" />

                <span className="text-xs font-medium text-slate-400">
                  Nenhum crédito disponível
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-l border-slate-200 pl-2 md:pl-4">
        <Button
          asChild
          variant="ghost"
          className="h-8 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <Link href="/assinatura/comprar-creditos">
            Adicionar
            <Plus className="ml-1 size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}