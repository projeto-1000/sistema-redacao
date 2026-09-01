"use server";

import { createClient } from "@/lib/server";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
} from "@/lib/integrations/datacrazy/sync-student";
import {
  CorrectionPayload,
  EssayStatus,
  GradedEssayListItem,
  GradedEssaysFilter,
  PendingEssayListItem,
  PendingEssaysFilter,
} from "@repo/types";
import { finalCorrectionSchema, normalizeCorrectionHighlights } from "@repo/validators";
import { sendEssayCorrectionAvailableEmail } from "@repo/email";
import { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
interface GetPendingEssaysParams {
  status: EssayStatus | EssayStatus[];
  filters?: PendingEssaysFilter;
  page?: number;
  limit?: number;
  correctionScope?: "personal" | "others";
}

interface GetGradedEssaysParams {
  filters?: GradedEssaysFilter;
  page?: number;
  limit?: number;
}

interface ReturnEssayParams {
  essayId: string;
  reason: string;
  description: string;
}

export async function getEssaysByStatus({
  status,
  filters,
  page = 1,
  limit = 10,
  correctionScope = "personal",
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
      id, title, thematic_axis, created_at, due_date, essay_remaining_business_seconds, status, submission_date,
      student:profiles!essays_student_id_fkey(full_name, avatar_url, email),
      teacher:profiles!essays_teacher_id_fkey(full_name, avatar_url)
    `,
    { count: "exact" }
  );

  if (limit) {
    query = query.limit(limit);
  }

  const statuses = Array.isArray(status) ? status : [status];

  if (correctionScope === "others") {
    query = query.eq("status", "correcting").neq("teacher_id", user.id);
  } else if (statuses.includes("correcting")) {
    const otherStatuses = statuses.filter((s) => s !== "correcting");

    if (otherStatuses.length > 0) {
      query = query.or(
        `status.in.(${otherStatuses.join(",")}),and(status.eq.correcting,teacher_id.eq.${user.id})`
      );
    } else {
      query = query.eq("status", "correcting").eq("teacher_id", user.id);
    }
  } else {
    query = query.in("status", statuses);
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
    const { student, teacher, ...rest } = essay;

    const studentData = student as unknown as {
      full_name: string;
      avatar_url: string;
      email: string;
    };
    const teacherData = teacher as unknown as { full_name: string; avatar_url: string } | null;

    return {
      ...rest,
      essay_remaining_business_seconds: Number(rest.essay_remaining_business_seconds),
      student_name: studentData.full_name,
      avatar_url: studentData.avatar_url,
      email: studentData.email,
      teacher_name: teacherData?.full_name,
      teacher_avatar: teacherData?.avatar_url,
    };
  });

  return {
    essays,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error || null,
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
    .from("vw_admin_essays")
    .select("*", { count: "exact" })
    .eq("status", "corrected");

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `title.ilike.${searchTerm},thematic_axis.ilike.${searchTerm},student_name.ilike.${searchTerm},teacher_name.ilike.${searchTerm}`
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
    .order("correction_date", { ascending: false });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

  return {
    essays: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error,
  };
}

export async function getGradedEssay(id: string) {
  const supabase = await createClient();

  const { data: essay, error: essayError } = await supabase
    .from("essays")
    .select(
      `
      *,
      student:profiles!essays_student_id_fkey(full_name),
      teacher:profiles!essays_teacher_id_fkey(full_name)
    `
    )
    .eq("id", id)
    .single();

  if (essayError || !essay) {
    console.error(`🚨 Erro ao buscar redação por ID (${id}):`, essayError);
    return null;
  }

  const { student, teacher, ...essayData } = essay;

  return {
    ...essayData,
    highlights: normalizeCorrectionHighlights(essayData.highlights),
    student_name: student.full_name,
    teacher_name: teacher?.full_name ?? "Corretor não informado",
    scores: {
      c1: essayData.score_c1,
      c2: essayData.score_c2,
      c3: essayData.score_c3,
      c4: essayData.score_c4,
      c5: essayData.score_c5,
    },
    comments: {
      c1: essayData.comment_c1,
      c2: essayData.comment_c2,
      c3: essayData.comment_c3,
      c4: essayData.comment_c4,
      c5: essayData.comment_c5,
    },
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

  const validationResult = finalCorrectionSchema.safeParse(payload);

  if (!validationResult.success) {
    console.error("Dados inválidos ao finalizar correção:", validationResult.error.flatten());

    return {
      success: false,
      error: "Preencha corretamente todos os campos obrigatórios antes de finalizar.",
    };
  }

  const correction = validationResult.data;

  const correctionValues = {
    status: "corrected",
    teacher_id: user.id,
    correction_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    score_c1: correction.scores.c1,
    score_c2: correction.scores.c2,
    score_c3: correction.scores.c3,
    score_c4: correction.scores.c4,
    score_c5: correction.scores.c5,

    comment_c1: correction.comments.c1,
    comment_c2: correction.comments.c2,
    comment_c3: correction.comments.c3,
    comment_c4: correction.comments.c4,
    comment_c5: correction.comments.c5,

    general_comment: correction.general_comment,
    main_bottleneck: correction.main_bottleneck,
    next_essay_priorities: correction.next_essay_priorities,
    rewrite_tasks: correction.rewrite_tasks,

    highlights: correction.highlights,
  };

  const { data: transitionedEssay, error: transitionError } = await supabase
    .from("essays")
    .update(correctionValues)
    .eq("id", essayId)
    .in("status", ["pending", "correcting"])
    .select(
      `
        student_id,
        status,
        title,
        student:profiles!essays_student_id_fkey(full_name, email)
      `
    )
    .maybeSingle();

  if (transitionError) {
    console.error("Erro ao salvar correção:", transitionError);
    return { success: false, error: "Não foi possível salvar a correção final." };
  }

  if (!transitionedEssay) {
    const { data: currentEssay, error: currentEssayError } = await supabase
      .from("essays")
      .select("status")
      .eq("id", essayId)
      .maybeSingle();

    if (currentEssayError || currentEssay?.status !== "corrected") {
      console.error("Erro ao confirmar status da correção:", currentEssayError);
      return { success: false, error: "Não foi possível salvar a correção final." };
    }

    return { success: true };
  }

  await supabase
    .from("correction_drafts")
    .delete()
    .eq("essay_id", essayId)
    .eq("teacher_id", user.id);

  try {
    await syncStudentToDataCrazy(transitionedEssay.student_id, "essay_status_updated");
  } catch (error) {
    console.error("[DATACRAZY_SYNC_ERROR]", {
      essay_id: essayId,
      student_id: transitionedEssay.student_id,
      event: "essay_status_updated",
      error_code: getDataCrazySyncErrorCode(error),
    });
  }

  const student = transitionedEssay.student as unknown as {
    full_name: string | null;
    email: string | null;
  } | null;

  if (student?.email) {
    try {
      await sendEssayCorrectionAvailableEmail({
        to: student.email,
        studentName: student.full_name,
        essayId,
        essayTitle: transitionedEssay.title,
      });
    } catch (error) {
      console.error("[ESSAY_CORRECTION_EMAIL_ERROR]", {
        essay_id: essayId,
        student_id: transitionedEssay.student_id,
        error,
      });
    }
  } else {
    console.warn("[ESSAY_CORRECTION_EMAIL_SKIPPED]", {
      essay_id: essayId,
      student_id: transitionedEssay.student_id,
      reason: "missing_student_email",
    });
  }

  revalidatePath("/inicio");
  revalidatePath(`/corrigir-redacao/${essayId}`);

  return { success: true };
}

export async function returnEssay({ essayId, reason, description }: ReturnEssayParams) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("return_essay_to_student", {
      p_essay_id: essayId,
      p_reason: reason,
      p_description: description,
    });

    if (error) {
      console.error("Erro no RPC de devolução:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    redirect("/redacoes-pendentes");

    return { success: true };
  } catch (err) {
    console.error("Erro inesperado na devolução:", err);
    return { success: false, error: "Erro interno ao processar a devolução." };
  }
}
