"use server";

import { createClient } from "@/lib/server";
import type { TeacherCorrectionRate } from "@repo/types";
import { revalidatePath } from "next/cache";

export interface CorrectionRateTeacherItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  currentRate: number;
  usesDefault: boolean;
  effectiveFrom: string;
  scheduledRate: number | null;
  scheduledFrom: string | null;
}

export interface CorrectionRatesManagementData {
  defaultRate: number;
  defaultEffectiveFrom: string;
  defaultScheduledRate: number | null;
  defaultScheduledFrom: string | null;
  teachers: CorrectionRateTeacherItem[];
}

function monthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function activeRate(rates: TeacherCorrectionRate[], teacherId: string | null, month: string) {
  return rates
    .filter(
      (rate) =>
        rate.teacher_id === teacherId &&
        rate.effective_from <= month &&
        (!rate.effective_to || rate.effective_to >= month),
    )
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0];
}

function scheduledRate(rates: TeacherCorrectionRate[], teacherId: string | null, month: string) {
  return rates
    .filter((rate) => rate.teacher_id === teacherId && rate.effective_from > month)
    .sort((a, b) => a.effective_from.localeCompare(b.effective_from))[0];
}

export async function getCorrectionRatesManagementData(): Promise<CorrectionRatesManagementData> {
  const supabase = await createClient();
  const currentMonth = monthStart();

  const [profilesResult, ratesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "TEACHER")
      .order("full_name"),
    supabase
      .from("teacher_correction_rates")
      .select("*")
      .order("effective_from", { ascending: true }),
  ]);

  if (profilesResult.error) throw new Error("Não foi possível carregar os professores.");
  if (ratesResult.error) throw new Error("Não foi possível carregar os valores de correção.");

  const rates = (ratesResult.data ?? []) as TeacherCorrectionRate[];
  const currentDefault = activeRate(rates, null, currentMonth);
  const futureDefault = scheduledRate(rates, null, currentMonth);

  if (!currentDefault) throw new Error("O valor padrão de correção não está configurado.");

  return {
    defaultRate: Number(currentDefault.amount),
    defaultEffectiveFrom: currentDefault.effective_from,
    defaultScheduledRate: futureDefault ? Number(futureDefault.amount) : null,
    defaultScheduledFrom: futureDefault?.effective_from ?? null,
    teachers: (profilesResult.data ?? []).map((teacher) => {
      const currentOverride = activeRate(rates, teacher.id, currentMonth);
      const futureOverride = scheduledRate(rates, teacher.id, currentMonth);

      return {
        id: teacher.id,
        name: teacher.full_name,
        email: teacher.email,
        avatarUrl: teacher.avatar_url,
        currentRate: Number(currentOverride?.amount ?? currentDefault.amount),
        usesDefault: !currentOverride,
        effectiveFrom: currentOverride?.effective_from ?? currentDefault.effective_from,
        scheduledRate: futureOverride ? Number(futureOverride.amount) : null,
        scheduledFrom: futureOverride?.effective_from ?? null,
      };
    }),
  };
}

export async function scheduleCorrectionRate(input: {
  teacherId: string | null;
  amount: number;
  effectiveFrom: string;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { success: false, error: "Informe um valor maior que zero." };
  }

  if (!/^\d{4}-\d{2}-01$/.test(input.effectiveFrom)) {
    return { success: false, error: "Selecione uma competência válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_teacher_correction_rate", {
    p_teacher_id: input.teacherId,
    p_amount: input.amount,
    p_effective_from: input.effectiveFrom,
  });

  if (error) {
    console.error("Erro ao agendar valor de correção:", error);
    return { success: false, error: "Não foi possível agendar o novo valor." };
  }

  revalidatePath("/professores/valores-correcao");
  revalidatePath("/professores");
  return { success: true };
}

export async function removeTeacherCorrectionRate(input: {
  teacherId: string;
  effectiveFrom: string;
}) {
  if (!/^\d{4}-\d{2}-01$/.test(input.effectiveFrom)) {
    return { success: false, error: "Selecione uma competência válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_teacher_correction_rate", {
    p_teacher_id: input.teacherId,
    p_amount: null,
    p_effective_from: input.effectiveFrom,
  });

  if (error) {
    console.error("Erro ao remover valor personalizado:", error);
    return { success: false, error: "Não foi possível remover o valor personalizado." };
  }

  revalidatePath("/professores/valores-correcao");
  return { success: true };
}
