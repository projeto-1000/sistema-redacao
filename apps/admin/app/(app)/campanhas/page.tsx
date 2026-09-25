import { getConversionCampaigns } from "@/app/actions/free-correction-campaign";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowRight, CalendarRange, Megaphone } from "lucide-react";
import Link from "next/link";

const CAMPAIGN_ROUTES: Record<string, string> = {
  post_free_correction: "/campanhas/correcao-gratuita",
};

function formatDate(value: string | null) {
  if (!value) return "Sem término definido";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "medium",
  }).format(new Date(value));
}

function campaignStatus(campaign: {
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
}) {
  const now = Date.now();
  const startsAt = new Date(campaign.starts_at).getTime();
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null;

  if (!campaign.is_active) {
    return { label: "Pausada", className: "bg-slate-100 text-slate-600" };
  }

  if (startsAt > now) {
    return { label: "Agendada", className: "bg-blue-100 text-blue-700" };
  }

  if (endsAt && endsAt <= now) {
    return { label: "Encerrada", className: "bg-amber-100 text-amber-700" };
  }

  return { label: "Em andamento", className: "bg-emerald-100 text-emerald-700" };
}

export default async function CampaignsPage() {
  const { campaigns, error } = await getConversionCampaigns();

  return (
    <div className="min-h-dvh space-y-8 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Campanhas"
        subtitle="Acompanhe as campanhas de conversão configuradas e seus períodos de vigência."
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
          {error} Tente novamente em alguns instantes.
        </div>
      )}

      {!error && campaigns.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Megaphone className="mx-auto size-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            Nenhuma campanha configurada
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            As campanhas aparecerão aqui assim que forem cadastradas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {campaigns.map((campaign) => {
          const status = campaignStatus(campaign);
          const href = CAMPAIGN_ROUTES[campaign.id];

          return (
            <article
              key={campaign.id}
              className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Megaphone className="size-6" aria-hidden="true" />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-slate-950">{campaign.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-relaxed text-slate-500">
                {campaign.description ?? "Campanha de conversão configurada no sistema."}
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <CalendarRange
                  className="mt-0.5 size-5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <div className="text-sm">
                  <p className="font-bold text-slate-700">
                    {formatDate(campaign.starts_at)} até {formatDate(campaign.ends_at)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Janela de atribuição: {campaign.attribution_window_days} dias
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                {href ? (
                  <Button asChild className="rounded-xl font-bold">
                    <Link href={href}>
                      Ver resultados
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="rounded-xl font-bold">
                    Relatório indisponível
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
