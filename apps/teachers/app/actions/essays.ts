"use server";

import { createClient } from "@/lib/server";
import { CorrectionPayload, EssayStatus } from "@repo/types";
import { revalidatePath } from "next/cache";
interface GetEssaysParams {
  status: EssayStatus;
  limit?: number;
}
interface FinishedEssayResponse {
  id: string;
  title: string;
  correction_date: string | null;
  total_score: number | null;
  student: {
    full_name: string | null;
  } | null;
}

export async function getEssaysByStatus({ status, limit }: GetEssaysParams) {
  const supabase = await createClient();

  let query = supabase
    .from("essays")
    .select(
      `
      id,
      title,
      created_at,
      student:profiles!essays_student_id_fkey(full_name)
    `
    )
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`🚨 Erro ao buscar redações (${status}):`, error);
    return [];
  }

  return data;
}

export async function getEssayById(id: string) {
  const supabase = await createClient();

  const { data: essay, error: essayError } = await supabase
    .from("essays")
    .select(
      `
      *,
      student:profiles!essays_student_id_fkey(full_name)
    `
    )
    .eq("id", id)
    .single();

  if (essayError || !essay) {
    console.error(`🚨 Erro ao buscar redação por ID (${id}):`, essayError);
    return null;
  }

  const { student, ...essayData } = essay;

  const { data: motivationalTexts, error: textsError } = await supabase
    .from("motivational_texts")
    .select("*")
    .eq("topic_id", essay.topic_id);

  if (textsError) {
    console.error(
      `⚠️ Erro ao buscar textos motivadores para o tema ${essay.topic_id}:`,
      textsError
    );
  }

  return {
    ...essayData,
    student: student.full_name,
    motivational_texts: motivationalTexts || [],
  };
}

export async function saveEssayCorrection(essayId: string, payload: CorrectionPayload) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("essays")
    .update({
      status: "done",
      teacher_id: user.id,
      correction_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      score_c1: payload.scores.c1,
      score_c2: payload.scores.c2,
      score_c3: payload.scores.c3,
      score_c4: payload.scores.c4,
      score_c5: payload.scores.c5,
      comment_c1: payload.comments.c1,
      comment_c2: payload.comments.c2,
      comment_c3: payload.comments.c3,
      comment_c4: payload.comments.c4,
      comment_c5: payload.comments.c5,

      general_comment: payload.general_comment,
      highlights: payload.highlights,
    })
    .eq("id", essayId);

  if (error) throw error;
  console.log({ error });

  revalidatePath("/inicio");
  revalidatePath(`/corrigir-redacao/${essayId}`);

  return { success: true };
}

export async function getFinishedEssays() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("Usuário não autenticado ao tentar buscar redações.");
    return [];
  }

  const { data, error } = await supabase
    .from("essays")
    .select(
      `
      id,
      title,
      correction_date,
      total_score,
      student:profiles!essays_student_id_fkey (
        full_name
      )
    `
    )
    .eq("status", "corrected")
    .eq("teacher_id", user.id)
    .order("correction_date", { ascending: false })
    .returns<FinishedEssayResponse[]>();

  if (error || !data) {
    console.error("Erro ao buscar redações:", error);
    return [];
  }

  return data.map((essay) => ({
    id: essay.id,
    student: essay.student?.full_name ?? "Estudante",
    topic: essay.title,
    correctedDate: essay.correction_date ?? "",
    score: essay.total_score ?? 0,
  }));
}

export async function getGradedEssay(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("essays")
    .select(
      `
      *,
      student:profiles!essays_student_id_fkey(full_name)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    studentName: data.student?.full_name || "Estudante",
    submittedAt: data.correction_date,
    title: data.title,
    totalScore: data.total_score,
    text: data.content,
    highlights: data.highlights || [],
    scores: {
      c1: data.score_c1,
      c2: data.score_c2,
      c3: data.score_c3,
      c4: data.score_c4,
      c5: data.score_c5,
    },
    comments: {
      c1: data.comment_c1,
      c2: data.comment_c2,
      c3: data.comment_c3,
      c4: data.comment_c4,
      c5: data.comment_c5,
    },
    generalComment: data.general_comment,
  };
}

export async function startEssayCorrection(essayId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { error: updateError } = await supabase
      .from("essays")
      .update({
        teacher_id: user.id,
        started_correction_at: new Date().toISOString(),
        status: "correcting",
      })
      .eq("id", essayId)
      .is("teacher_id", null);

    if (updateError) {
      console.error("🚨 Erro ao vincular professor:", updateError);
      return { success: false, error: "Erro ao iniciar correção." };
    }

    revalidatePath("/redacoes-pendentes");

    return { success: true };
  } catch (error) {
    console.error("🚨 Erro interno:", error);
    return { success: false, error: "Erro inesperado do servidor." };
  }
}
