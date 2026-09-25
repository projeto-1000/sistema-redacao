"use server";

import { createClient } from "@/lib/server";
import { generateCsv } from "@repo/utils";

export interface ConversionCampaignSummary {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  attribution_window_days: number;
}

export interface FreeCorrectionCampaignPlacementMetrics {
  impressions: number;
  clickers: number;
  dismissals: number;
  checkout_starters: number;
  click_conversions: number;
  click_revenue_cents: number;
}

export interface FreeCorrectionCampaignMetrics {
  period: {
    from: string;
    to: string;
  };
  totals: {
    eligible: number;
    exposed: number;
    clickers: number;
    dismissals: number;
    checkout_starters: number;
    conversions: number;
    click_conversions: number;
    revenue_cents: number;
    click_revenue_cents: number;
  };
  placements: {
    score_card: FreeCorrectionCampaignPlacementMetrics;
    footer_banner: FreeCorrectionCampaignPlacementMetrics;
  };
}

const EMPTY_PLACEMENT: FreeCorrectionCampaignPlacementMetrics = {
  impressions: 0,
  clickers: 0,
  dismissals: 0,
  checkout_starters: 0,
  click_conversions: 0,
  click_revenue_cents: 0,
};

function emptyMetrics(from: string, to: string): FreeCorrectionCampaignMetrics {
  return {
    period: { from, to },
    totals: {
      eligible: 0,
      exposed: 0,
      clickers: 0,
      dismissals: 0,
      checkout_starters: 0,
      conversions: 0,
      click_conversions: 0,
      revenue_cents: 0,
      click_revenue_cents: 0,
    },
    placements: {
      score_card: { ...EMPTY_PLACEMENT },
      footer_banner: { ...EMPTY_PLACEMENT },
    },
  };
}

export async function getFreeCorrectionCampaignMetrics(
  from: string,
  to: string
): Promise<{
  metrics: FreeCorrectionCampaignMetrics;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_post_free_correction_campaign_metrics", {
    p_from: from,
    p_to: to,
  });

  if (error || !data) {
    return {
      metrics: emptyMetrics(from, to),
      error: "Não foi possível carregar as métricas da campanha.",
    };
  }

  return {
    metrics: data as FreeCorrectionCampaignMetrics,
    error: null,
  };
}

export async function getConversionCampaigns(): Promise<{
  campaigns: ConversionCampaignSummary[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversion_campaigns")
    .select("id, name, description, is_active, starts_at, ends_at, attribution_window_days")
    .order("starts_at", { ascending: false });

  if (error) {
    return { campaigns: [], error: "Não foi possível carregar as campanhas." };
  }

  return { campaigns: (data ?? []) as ConversionCampaignSummary[], error: null };
}

export async function getConversionCampaign(
  campaignId: string
): Promise<ConversionCampaignSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversion_campaigns")
    .select("id, name, description, is_active, starts_at, ends_at, attribution_window_days")
    .eq("id", campaignId)
    .maybeSingle();

  if (error || !data) return null;

  return data as ConversionCampaignSummary;
}

export async function exportFreeCorrectionCampaignCsv(payload: { from: string; to: string }) {
  const { metrics, error } = await getFreeCorrectionCampaignMetrics(payload.from, payload.to);

  if (error) throw new Error(error);

  const { totals, placements } = metrics;
  const rows = [
    {
      scope: "Geral",
      eligible: totals.eligible,
      exposed: totals.exposed,
      clicks: totals.clickers,
      ctr: percentageForCsv(totals.clickers, totals.exposed),
      dismissals: totals.dismissals,
      checkout: totals.checkout_starters,
      subscriptions: totals.conversions,
      revenue: currencyForCsv(totals.revenue_cents),
    },
    {
      scope: "Card da nota",
      eligible: "",
      exposed: placements.score_card.impressions,
      clicks: placements.score_card.clickers,
      ctr: percentageForCsv(placements.score_card.clickers, placements.score_card.impressions),
      dismissals: placements.score_card.dismissals,
      checkout: placements.score_card.checkout_starters,
      subscriptions: placements.score_card.click_conversions,
      revenue: currencyForCsv(placements.score_card.click_revenue_cents),
    },
    {
      scope: "Banner inferior",
      eligible: "",
      exposed: placements.footer_banner.impressions,
      clicks: placements.footer_banner.clickers,
      ctr: percentageForCsv(
        placements.footer_banner.clickers,
        placements.footer_banner.impressions
      ),
      dismissals: placements.footer_banner.dismissals,
      checkout: placements.footer_banner.checkout_starters,
      subscriptions: placements.footer_banner.click_conversions,
      revenue: currencyForCsv(placements.footer_banner.click_revenue_cents),
    },
  ];

  return generateCsv(rows, [
    { header: "Escopo", key: (row) => row.scope },
    { header: "Alunos elegíveis", key: (row) => String(row.eligible) },
    { header: "Expostos", key: (row) => String(row.exposed) },
    { header: "Cliques", key: (row) => String(row.clicks) },
    { header: "CTR", key: (row) => row.ctr },
    { header: "Fechamentos", key: (row) => String(row.dismissals) },
    { header: "Checkouts iniciados", key: (row) => String(row.checkout) },
    { header: "Assinaturas", key: (row) => String(row.subscriptions) },
    { header: "Receita atribuída", key: (row) => row.revenue },
  ]);
}

function percentageForCsv(value: number, total: number) {
  if (total <= 0) return "0%";

  return `${((value / total) * 100).toFixed(1).replace(".", ",")}%`;
}

function currencyForCsv(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}
