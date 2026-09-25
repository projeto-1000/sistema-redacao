"use server";

import { createClient } from "@/lib/server";
import { formatDate, generateCsv } from "@repo/utils";

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

export type FreeCorrectionCampaignAudienceStage =
  | "eligible"
  | "exposed"
  | "clicked"
  | "checkout_started"
  | "converted";

export interface FreeCorrectionCampaignAudienceStudent {
  participant_id: string;
  user_id: string;
  essay_id: string;
  full_name: string | null;
  email: string;
  phone: string;
  eligible_at: string;
  first_impression_at: string | null;
  first_click_at: string | null;
  checkout_started_at: string | null;
  last_event_at: string | null;
  last_click_placement: FreeCorrectionCampaignPlacement | null;
  stage: FreeCorrectionCampaignAudienceStage;
  converted_at: string | null;
  attribution_type: "last_click" | "view_through" | null;
  attributed_placement: FreeCorrectionCampaignPlacement | null;
  revenue_cents: number;
}

type FreeCorrectionCampaignPlacement = "score_card" | "footer_banner";

type FreeCorrectionCampaignTimelineEventType =
  | "eligible"
  | "impression"
  | "click"
  | "dismiss"
  | "checkout_started"
  | "converted";

interface FreeCorrectionCampaignTimelineEvent {
  event_id: string;
  participant_id: string;
  user_id: string;
  essay_id: string;
  full_name: string | null;
  email: string;
  event_type: FreeCorrectionCampaignTimelineEventType;
  placement: FreeCorrectionCampaignPlacement | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

interface FreeCorrectionCampaignAudienceResult {
  total: number;
  students: FreeCorrectionCampaignAudienceStudent[];
}

interface FreeCorrectionCampaignEventsResult {
  total: number;
  events: FreeCorrectionCampaignTimelineEvent[];
}

const EMPTY_PLACEMENT: FreeCorrectionCampaignPlacementMetrics = {
  impressions: 0,
  clickers: 0,
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

async function loadFreeCorrectionCampaignAudience(
  from: string,
  to: string,
  limit: number,
  offset: number
): Promise<{ data: FreeCorrectionCampaignAudienceResult | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_post_free_correction_campaign_audience", {
    p_from: from,
    p_to: to,
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !data) {
    // Next.js always provides NODE_ENV; expose RPC diagnostics only during local testing.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.NODE_ENV === "development") {
      console.error("[FREE_CORRECTION_CAMPAIGN_AUDIENCE_ERROR]", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        from,
        to,
      });
    }

    return { data: null, error: "Não foi possível carregar os alunos da campanha." };
  }

  return { data: data as FreeCorrectionCampaignAudienceResult, error: null };
}

async function loadFreeCorrectionCampaignEvents(
  from: string,
  to: string,
  limit: number,
  offset: number
): Promise<{ data: FreeCorrectionCampaignEventsResult | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_post_free_correction_campaign_events", {
    p_from: from,
    p_to: to,
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !data) {
    return { data: null, error: "Não foi possível carregar os eventos da campanha." };
  }

  return { data: data as FreeCorrectionCampaignEventsResult, error: null };
}

export async function getFreeCorrectionCampaignAudience(
  from: string,
  to: string,
  page = 1,
  limit = 10
): Promise<{
  students: FreeCorrectionCampaignAudienceStudent[];
  total: number;
  totalPages: number;
  error: string | null;
}> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const { data, error } = await loadFreeCorrectionCampaignAudience(
    from,
    to,
    safeLimit,
    (safePage - 1) * safeLimit
  );

  if (error || !data) {
    return { students: [], total: 0, totalPages: 0, error };
  }

  // Next.js always provides NODE_ENV; keep campaign audience data out of production logs.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[FREE_CORRECTION_CAMPAIGN_AUDIENCE]",
      data.students.map((student) => ({
        studentId: student.user_id,
        name: student.full_name,
        essayId: student.essay_id,
      }))
    );
  }

  return {
    students: data.students,
    total: data.total,
    totalPages: Math.ceil(data.total / safeLimit),
    error: null,
  };
}

export async function exportFreeCorrectionCampaignCsv(payload: { from: string; to: string }) {
  const { metrics, error } = await getFreeCorrectionCampaignMetrics(payload.from, payload.to);

  if (error) throw new Error(error);

  const { totals, placements } = metrics;
  const periodStart = formatDateTimeForCsv(metrics.period.from);
  const periodEnd = formatDateTimeForCsv(metrics.period.to);
  const rows = [
    {
      scope: "Geral",
      periodStart,
      periodEnd,
      eligible: totals.eligible,
      exposed: totals.exposed,
      exposureRate: percentageForCsv(totals.exposed, totals.eligible),
      clicks: totals.clickers,
      ctr: percentageForCsv(totals.clickers, totals.exposed),
      checkout: totals.checkout_starters,
      checkoutRate: percentageForCsv(totals.checkout_starters, totals.clickers),
      subscriptions: totals.conversions,
      conversionRate: percentageForCsv(totals.conversions, totals.checkout_starters),
      revenue: currencyForCsv(totals.revenue_cents),
    },
    {
      scope: "Card da nota",
      periodStart,
      periodEnd,
      eligible: "",
      exposed: placements.score_card.impressions,
      exposureRate: "",
      clicks: placements.score_card.clickers,
      ctr: percentageForCsv(placements.score_card.clickers, placements.score_card.impressions),
      checkout: placements.score_card.checkout_starters,
      checkoutRate: percentageForCsv(
        placements.score_card.checkout_starters,
        placements.score_card.clickers
      ),
      subscriptions: placements.score_card.click_conversions,
      conversionRate: percentageForCsv(
        placements.score_card.click_conversions,
        placements.score_card.checkout_starters
      ),
      revenue: currencyForCsv(placements.score_card.click_revenue_cents),
    },
    {
      scope: "Banner inferior",
      periodStart,
      periodEnd,
      eligible: "",
      exposed: placements.footer_banner.impressions,
      exposureRate: "",
      clicks: placements.footer_banner.clickers,
      ctr: percentageForCsv(
        placements.footer_banner.clickers,
        placements.footer_banner.impressions
      ),
      checkout: placements.footer_banner.checkout_starters,
      checkoutRate: percentageForCsv(
        placements.footer_banner.checkout_starters,
        placements.footer_banner.clickers
      ),
      subscriptions: placements.footer_banner.click_conversions,
      conversionRate: percentageForCsv(
        placements.footer_banner.click_conversions,
        placements.footer_banner.checkout_starters
      ),
      revenue: currencyForCsv(placements.footer_banner.click_revenue_cents),
    },
  ];

  return generateCsv(rows, [
    { header: "Escopo", key: (row) => row.scope },
    { header: "Início do período", key: (row) => row.periodStart },
    { header: "Fim do período", key: (row) => row.periodEnd },
    { header: "Alunos elegíveis", key: (row) => String(row.eligible) },
    { header: "Expostos", key: (row) => String(row.exposed) },
    { header: "Taxa de exposição", key: (row) => row.exposureRate },
    { header: "Cliques", key: (row) => String(row.clicks) },
    { header: "CTR", key: (row) => row.ctr },
    { header: "Checkouts iniciados", key: (row) => String(row.checkout) },
    { header: "Clique para checkout", key: (row) => row.checkoutRate },
    { header: "Assinaturas", key: (row) => String(row.subscriptions) },
    { header: "Checkout para assinatura", key: (row) => row.conversionRate },
    { header: "Receita atribuída", key: (row) => row.revenue },
  ]);
}

export async function exportFreeCorrectionCampaignAudienceCsv(payload: {
  from: string;
  to: string;
}) {
  const students: FreeCorrectionCampaignAudienceStudent[] = [];
  const pageSize = 500;
  let offset = 0;
  let total = 0;

  do {
    const { data, error } = await loadFreeCorrectionCampaignAudience(
      payload.from,
      payload.to,
      pageSize,
      offset
    );

    if (error || !data) throw new Error(error ?? "Erro ao exportar alunos da campanha.");

    students.push(...data.students);
    total = data.total;

    if (data.students.length === 0) break;

    offset += data.students.length;
  } while (offset < total);

  return generateCsv(students, [
    { header: "Nome", key: (student) => student.full_name ?? "" },
    { header: "E-mail", key: (student) => student.email },
    { header: "Telefone", key: (student) => student.phone },
    { header: "ID do aluno", key: (student) => student.user_id },
    { header: "ID da redação", key: (student) => student.essay_id },
    {
      header: "Entrada na campanha",
      key: (student) => formatDateTimeForCsv(student.eligible_at),
    },
    {
      header: "Primeira visualização",
      key: (student) => formatDateTimeForCsv(student.first_impression_at),
    },
    {
      header: "Primeiro clique",
      key: (student) => formatDateTimeForCsv(student.first_click_at),
    },
    {
      header: "Início do checkout",
      key: (student) => formatDateTimeForCsv(student.checkout_started_at),
    },
    {
      header: "Assinatura",
      key: (student) => formatDateTimeForCsv(student.converted_at),
    },
    { header: "Etapa atual", key: (student) => audienceStageLabel(student.stage) },
    {
      header: "Última interação",
      key: (student) => formatDateTimeForCsv(student.last_event_at),
    },
    {
      header: "Último banner clicado",
      key: (student) => placementLabel(student.last_click_placement),
    },
    {
      header: "Tipo de atribuição",
      key: (student) => attributionLabel(student.attribution_type),
    },
    {
      header: "Banner atribuído",
      key: (student) => placementLabel(student.attributed_placement),
    },
    {
      header: "Receita atribuída",
      key: (student) => currencyForCsv(student.revenue_cents),
    },
  ]);
}

export async function exportFreeCorrectionCampaignEventsCsv(payload: { from: string; to: string }) {
  const events: FreeCorrectionCampaignTimelineEvent[] = [];
  const pageSize = 500;
  let offset = 0;
  let total = 0;

  do {
    const { data, error } = await loadFreeCorrectionCampaignEvents(
      payload.from,
      payload.to,
      pageSize,
      offset
    );

    if (error || !data) throw new Error(error ?? "Erro ao exportar eventos da campanha.");

    events.push(...data.events);
    total = data.total;

    if (data.events.length === 0) break;

    offset += data.events.length;
  } while (offset < total);

  return generateCsv(events, [
    { header: "Nome", key: (event) => event.full_name ?? "" },
    { header: "E-mail", key: (event) => event.email },
    { header: "ID do aluno", key: (event) => event.user_id },
    { header: "ID da redação", key: (event) => event.essay_id },
    { header: "Etapa", key: (event) => timelineEventLabel(event.event_type) },
    { header: "Banner", key: (event) => placementLabel(event.placement) },
    { header: "Data e hora", key: (event) => formatDateTimeForCsv(event.occurred_at) },
    {
      header: "Tipo de atribuição",
      key: (event) =>
        event.event_type === "converted"
          ? attributionLabel(metadataString(event.metadata, "attribution_type"))
          : "",
    },
    {
      header: "Receita atribuída",
      key: (event) =>
        event.event_type === "converted"
          ? currencyForCsv(metadataNumber(event.metadata, "revenue_cents"))
          : "",
    },
    { header: "ID do evento", key: (event) => event.event_id },
  ]);
}

function audienceStageLabel(stage: FreeCorrectionCampaignAudienceStage) {
  const labels: Record<FreeCorrectionCampaignAudienceStage, string> = {
    eligible: "Elegível",
    exposed: "Visualizou",
    clicked: "Clicou",
    checkout_started: "Iniciou checkout",
    converted: "Assinou",
  };

  return labels[stage];
}

function timelineEventLabel(eventType: FreeCorrectionCampaignTimelineEventType) {
  const labels: Record<FreeCorrectionCampaignTimelineEventType, string> = {
    eligible: "Entrou na campanha",
    impression: "Visualizou",
    click: "Clicou",
    dismiss: "Fechou o banner",
    checkout_started: "Iniciou checkout",
    converted: "Assinou",
  };

  return labels[eventType];
}

function placementLabel(placement: FreeCorrectionCampaignPlacement | null) {
  if (placement === "score_card") return "Card da nota";
  if (placement === "footer_banner") return "Banner inferior";

  return "";
}

function attributionLabel(attributionType: string | null) {
  if (attributionType === "last_click") return "Último clique";
  if (attributionType === "view_through") return "Após visualização";

  return "";
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return typeof value === "string" ? value : null;
}

function metadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return typeof value === "number" ? value : 0;
}

function formatDateTimeForCsv(value: string | null) {
  if (!value) return "";

  return formatDate(value, "date-time");
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
