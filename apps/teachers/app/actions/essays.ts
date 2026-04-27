"use server";

import { createClient } from "@/lib/server";
import {
  GradedEssayListItem,
  GradedEssaysFilter,
  PendingEssayListItem,
  PendingEssaysFilter,
} from "@/types";
import { CorrectionPayload, EssayStatus } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
interface GetPendingEssaysParams {
  status: EssayStatus | EssayStatus[];
  filters?: PendingEssaysFilter;
  page?: number;
  limit?: number;
}
interface GetGradedEssaysParams {
  filters?: GradedEssaysFilter;
  page?: number;
  limit?: number;
}

export async function getEssaysByStatus({
  status,
  filters,
  page = 1,
  limit = 10,
}: GetPendingEssaysParams): Promise<{
  essays: PendingEssayListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase.from("essays").select(
    `
      id,
      title,
      thematic_axis,
      created_at,
      due_date,
      status,
      submission_date,
      student:profiles!essays_student_id_fkey(full_name, avatar_url)
    `,
    { count: "exact" }
  );

  if (limit) {
    query = query.limit(limit);
  }

  if (Array.isArray(status)) {
    query = query.in("status", status);
  } else {
    query = query.eq("status", status);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,thematic_axis.ilike.%${filters.search}%`);
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

  const essays = data.map((essay) => {
    const { student, ...rest } = essay;
    const studentData = student as unknown as {
      full_name: string;
      avatar_url: string;
      email: string;
    };

    return {
      ...rest,
      student_name: studentData.full_name,
      avatar_url: studentData.avatar_url,
      email: studentData.email,
    };
  });

  return {
    essays: essays,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error || null,
  };
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

  return {
    ...essayData,
    student: student.full_name,
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
      status: "corrected",
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

  if (error) {
    console.error("Erro ao salvar correção:", error);
    return { success: false, error: "Não foi possível salvar a correção final." };
  }

  await supabase
    .from("correction_drafts")
    .delete()
    .eq("essay_id", essayId)
    .eq("teacher_id", user.id);

  revalidatePath("/inicio");
  revalidatePath(`/corrigir-redacao/${essayId}`);

  return { success: true };
}

export async function getGradedEssays({
  filters,
  page = 1,
  limit = 10,
}: GetGradedEssaysParams): Promise<{
  essays: GradedEssayListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("vw_teacher_essays")
    .select("*", { count: "exact" })
    .eq("teacher_id", user.id)
    .eq("status", "corrected");

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `title.ilike.${searchTerm},thematic_axis.ilike.${searchTerm},student_name.ilike.${searchTerm}`
    );
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,thematic_axis.ilike.%${filters.search},student_name.ilike.${filters.search}%`
    );
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

  // const essays = data.map((essay) => {
  //   const { student, ...rest } = essay;
  //   const studentData = student as unknown as {
  //     full_name: string;
  //     avatar_url: string;
  //     email: string;
  //   };

  //   return {
  //     ...rest,
  //     student_name: studentData.full_name,
  //     avatar_url: studentData.avatar_url,
  //     email: studentData.email,
  //   };
  // });

  return {
    essays: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error || null,
  };
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
