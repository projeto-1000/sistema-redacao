import {
  getConversionCampaign,
  getFreeCorrectionCampaignMetrics,
} from "@/app/actions/free-correction-campaign";
import { CampaignPeriodActions } from "@/components/campaign-period-actions";
import { PageHeader } from "@repo/ui/components/page-header";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarRange,
  CreditCard,
  Eye,
  Info,
  MousePointerClick,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

const BRAZIL_OFFSET = "-03:00";

function formatDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function resolvePeriod(from?: string, to?: string) {
  const today = new Date();
  const defaultFrom = new Date(today);

  defaultFrom.setDate(defaultFrom.getDate() - 29);

  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(from ?? "")
    ? (from as string)
    : formatDateInput(defaultFrom);
  const toDate = /^\d{4}-\d{2}-\d{2}$/.test(to ?? "") ? (to as string) : formatDateInput(today);

  return {
    fromDate,
    toDate,
    fromIso: `${fromDate}T00:00:00${BRAZIL_OFFSET}`,
    toIso: `${toDate}T23:59:59.999${BRAZIL_OFFSET}`,
  };
}

function percentage(value: number, total: number) {
  if (total <= 0) return "0%";

  return `${((value / total) * 100).toFixed(1).replace(".", ",")}%`;
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatCampaignDate(value: string | null) {
  if (!value) return "Sem data de término";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "long",
  }).format(new Date(value));
}

export default async function FreeCorrectionCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = resolvePeriod(params.from, params.to);
  const [{ metrics, error }, campaign] = await Promise.all([
    getFreeCorrectionCampaignMetrics(period.fromIso, period.toIso),
    getConversionCampaign("post_free_correction"),
  ]);
  const { totals } = metrics;

  const cards = [
    {
      label: "Alunos elegíveis",
      value: totals.eligible.toLocaleString("pt-BR"),
      helper: "Entraram na campanha",
      icon: Users,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      label: "Expostos",
      value: totals.exposed.toLocaleString("pt-BR"),
      helper: `${percentage(totals.exposed, totals.eligible)} dos elegíveis`,
      icon: Eye,
      iconClass: "bg-violet-100 text-violet-700",
    },
    {
      label: "Clicaram",
      value: totals.clickers.toLocaleString("pt-BR"),
      helper: `CTR ${percentage(totals.clickers, totals.exposed)}`,
      icon: MousePointerClick,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Iniciaram checkout",
      value: totals.checkout_starters.toLocaleString("pt-BR"),
      helper: `${percentage(totals.checkout_starters, totals.clickers)} dos cliques`,
      icon: ShoppingCart,
      iconClass: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Novas assinaturas",
      value: totals.conversions.toLocaleString("pt-BR"),
      helper: `${percentage(totals.conversions, totals.exposed)} dos expostos`,
      icon: CreditCard,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Receita inicial",
      value: formatCurrency(totals.revenue_cents),
      helper: `${totals.click_conversions} após clique`,
      icon: BadgeDollarSign,
      iconClass: "bg-green-100 text-green-700",
    },
  ];

  const placementRows = [
    { label: "Card da nota", metrics: metrics.placements.score_card },
    { label: "Banner inferior", metrics: metrics.placements.footer_banner },
  ];

  return (
    <div className="space-y-8 px-4 py-4 md:px-10 lg:px-12">
      <Link
        href="/campanhas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas as campanhas
      </Link>

      <PageHeader
        title={campaign?.name ?? "Pós-correção gratuita"}
        subtitle="Acompanhe o caminho dos alunos elegíveis até a primeira assinatura paga."
      >
        <CampaignPeriodActions
          key={`${period.fromDate}-${period.toDate}`}
          fromDate={period.fromDate}
          toDate={period.toDate}
          fromIso={period.fromIso}
          toIso={period.toIso}
        />
      </PageHeader>

      {campaign && (
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">Vigência da campanha</p>
            <p className="mt-1 text-sm text-slate-500">
              Fora desse período, os banners deixam de ser exibidos e não recebem novos eventos.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <CalendarRange className="size-5 text-slate-400" aria-hidden="true" />
            <span>{formatCampaignDate(campaign.starts_at)}</span>
            <span className="text-slate-300">até</span>
            <span>{formatCampaignDate(campaign.ends_at)}</span>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
          {error} Tente novamente em alguns instantes.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="flex items-start justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{card.helper}</p>
              </div>

              <div
                className={`flex size-11 items-center justify-center rounded-full ${card.iconClass}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">Funil da campanha</h2>
          <p className="mt-1 text-sm text-slate-500">Contagens únicas por aluno no período.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ["Expostos", totals.exposed, null],
            ["Clicaram", totals.clickers, percentage(totals.clickers, totals.exposed)],
            [
              "Checkout",
              totals.checkout_starters,
              percentage(totals.checkout_starters, totals.clickers),
            ],
            [
              "Assinaram",
              totals.conversions,
              percentage(totals.conversions, totals.checkout_starters),
            ],
          ].map(([label, value, rate]) => (
            <div key={String(label)} className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {Number(value).toLocaleString("pt-BR")}
              </p>
              {rate && <p className="mt-1 text-xs font-bold text-emerald-600">{rate}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-xl font-extrabold text-slate-950">Comparação entre os banners</h2>
          <p className="mt-1 text-sm text-slate-500">
            Mostra qual ponto da tela mais contribui para cliques, início de checkout e novas
            assinaturas.
          </p>
        </div>

        <div className="flex items-start gap-3 border-b border-blue-100 bg-blue-50 px-6 py-4 text-sm text-blue-900 sm:px-8">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
          <p>
            A assinatura e a receita aparecem na posição do último banner clicado até 7 dias antes
            da compra. Assim, é possível entender qual dos dois convites teve maior influência na
            conversão.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-240 text-left">
            <thead className="bg-slate-50 text-xs font-bold tracking-wider text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4 sm:px-8">Posição</th>
                <th className="px-4 py-4">Expostos</th>
                <th className="px-4 py-4">Cliques</th>
                <th className="px-4 py-4">CTR</th>
                <th className="px-4 py-4">Fechamentos</th>
                <th className="px-4 py-4">Checkout</th>
                <th className="px-4 py-4">Assinaturas</th>
                <th className="px-6 py-4 sm:px-8">Receita atribuída</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {placementRows.map((row) => (
                <tr key={row.label} className="text-sm text-slate-700">
                  <td className="px-6 py-5 font-bold text-slate-950 sm:px-8">{row.label}</td>
                  <td className="px-4 py-5">{row.metrics.impressions}</td>
                  <td className="px-4 py-5">{row.metrics.clickers}</td>
                  <td className="px-4 py-5 font-bold text-emerald-700">
                    {percentage(row.metrics.clickers, row.metrics.impressions)}
                  </td>
                  <td className="px-4 py-5">
                    {row.metrics.dismissals}
                    {row.metrics.dismissals > 0 && (
                      <span className="ml-1 text-xs text-slate-400">
                        ({percentage(row.metrics.dismissals, row.metrics.impressions)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-5">{row.metrics.checkout_starters}</td>
                  <td className="px-4 py-5">{row.metrics.click_conversions}</td>
                  <td className="px-6 py-5 font-bold text-slate-950 sm:px-8">
                    {formatCurrency(row.metrics.click_revenue_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500 sm:px-8">
          <X className="size-4 text-slate-400" aria-hidden="true" />O card da nota não possui
          fechamento; essa métrica se aplica ao banner inferior.
        </div>
      </section>
    </div>
  );
}
