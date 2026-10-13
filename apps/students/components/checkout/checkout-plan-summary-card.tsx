import { getPlanCreditSummary } from "@/utils/plan-credit-summary";
import type { CheckoutPlanData } from "@/types";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { formatCurrency, getCycleInfo } from "@repo/utils";
import { CalendarClock, CheckCircle2, Clock3, Sparkles } from "lucide-react";

interface CheckoutPlanSummaryCardProps {
  plan: CheckoutPlanData;
}

export function CheckoutPlanSummaryCard({ plan }: CheckoutPlanSummaryCardProps) {
  const cycle = getCycleInfo(plan.interval, plan.intervalCount);

  const creditSummary = getPlanCreditSummary({
    creditsIncluded: plan.creditsIncluded,
    creditsExpirationDays: plan.creditsExpirationDays,
    interval: plan.interval,
    intervalCount: plan.intervalCount,
  });

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white p-0 shadow-sm">
      <CardHeader className="space-y-6 bg-slate-950 p-8 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="text-primary flex size-12 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="size-6" />
          </div>

          <Badge className="bg-primary hover:bg-primary rounded-full px-4 py-1.5 text-sm font-bold text-amber-950">
            Plano selecionado
          </Badge>
        </div>

        <div>
          <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight">{formatCurrency(plan.price)}</span>

            {cycle.suffix && (
              <span className="text-base font-bold text-slate-300">{cycle.suffix}</span>
            )}
          </div>

          <p className="mt-3 text-sm font-bold text-slate-400">
            Cobrança {cycle.label.toLowerCase()}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-6 md:px-8 md:pb-8">
        <PlanBenefits
          creditsLabel={creditSummary.creditsLabel}
          validityLabel={creditSummary.validityLabel}
          bonusLabel={creditSummary.bonusLabel}
        />

        <Separator />

        <div className="space-y-3 text-sm font-bold text-slate-700">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span>{formatCurrency(plan.price)}</span>
          </div>

          <div className="flex justify-between gap-4 text-slate-400">
            <span>Taxas</span>
            <span>{formatCurrency(0)}</span>
          </div>

          <div className="flex justify-between gap-4 border-t border-slate-100 pt-4 text-xl font-black">
            <span>Total</span>
            <span>{formatCurrency(plan.price)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlanBenefitsProps {
  creditsLabel: string;
  validityLabel: string;
  bonusLabel: string | null;
}

function PlanBenefits({ creditsLabel, validityLabel, bonusLabel }: PlanBenefitsProps) {
  return (
    <div>
      <p className="mb-4 text-xs font-black tracking-widest text-slate-500 uppercase">
        Benefícios do plano
      </p>

      <div className="space-y-4">
        <BenefitRow
          icon={CheckCircle2}
          title={creditsLabel}
          description="Quantidade incluída no plano."
        />

        <BenefitRow
          icon={Clock3}
          title={validityLabel}
          description="Prazo para usar seus créditos."
        />

        {bonusLabel && (
          <BenefitRow
            icon={CalendarClock}
            title={bonusLabel}
            description="Vantagem dos planos de maior duração."
            highlighted
          />
        )}
      </div>
    </div>
  );
}

interface BenefitRowProps {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  highlighted?: boolean;
}

function BenefitRow({ icon: Icon, title, description, highlighted = false }: BenefitRowProps) {
  return (
    <div className="flex gap-3 border-b border-slate-200/70 pb-4 last:border-b-0 last:pb-0">
      <div className="text-primary flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm leading-snug font-black">{title}</p>

          {highlighted && (
            <span className="bg-primary rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide text-amber-950 uppercase">
              Extra
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-500">{description}</p>
      </div>
    </div>
  );
}
