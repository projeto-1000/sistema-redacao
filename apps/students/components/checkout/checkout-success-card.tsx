import type { CheckoutSuccessData } from "@/types";
import {
  getCheckoutSuccessDescription,
  getPaymentMethodLabel,
  getSubscriptionStatusLabel,
} from "@/utils/checkout-success-labels";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { formatCurrency } from "@repo/utils";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface CheckoutSuccessCardProps {
  data: CheckoutSuccessData;
}

export function CheckoutSuccessCard({ data }: CheckoutSuccessCardProps) {
  const { subscription, plan } = data;

  return (
    <Card className="w-full overflow-hidden rounded-3xl border-slate-100 bg-white p-0 shadow-sm">
      <CardHeader className="bg-slate-950 p-8 text-white md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/20 text-primary">
            <CheckCircle2 className="size-8" />
          </div>

          <Badge className="w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-black text-amber-950 hover:bg-primary">
            {getSubscriptionStatusLabel(subscription.status)}
          </Badge>
        </div>

        <div className="mt-8 space-y-3">
          <CardTitle className="text-3xl font-black tracking-tight md:text-4xl">
            Assinatura criada com sucesso
          </CardTitle>

          <p className="max-w-2xl text-base font-semibold leading-relaxed text-slate-300">
            {getCheckoutSuccessDescription(
              subscription.paymentMethod,
              subscription.status
            )}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <CheckoutSuccessInfoCard
            icon={FileText}
            label="Plano"
            value={plan?.name ?? "Plano selecionado"}
            description={
              plan
                ? `${plan.creditsIncluded} correções incluídas`
                : "Informações do plano contratado"
            }
          />

          <CheckoutSuccessInfoCard
            icon={CreditCard}
            label="Pagamento"
            value={getPaymentMethodLabel(subscription.paymentMethod)}
            description={
              plan
                ? `${formatCurrency(plan.price)} no total`
                : "Pagamento vinculado à assinatura"
            }
          />
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-sm font-black text-slate-900">Próximos passos</p>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
            Você pode voltar para o início e acompanhar seu plano pela área de
            assinatura. Os créditos devem ser liberados conforme a confirmação
            do pagamento.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-12 rounded-2xl px-6 font-bold sm:flex-1">
            <Link href="/inicio">
              Ir para o início
              <Home className="ml-2 size-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl px-6 font-bold sm:flex-1"
          >
            <Link href="/assinatura/mudar-plano">
              Ver assinatura
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CheckoutSuccessInfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}

function CheckoutSuccessInfoCard({
  icon: Icon,
  label,
  value,
  description,
}: CheckoutSuccessInfoCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-5" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-base font-black text-slate-900">{value}</p>

          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}