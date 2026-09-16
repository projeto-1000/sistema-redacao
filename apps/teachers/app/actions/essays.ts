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
  MotivationalText,
  GradedEssaysFilter,
  PendingEssayListItem,
  PendingEssaysFilter,
} from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { finalCorrectionSchema, normalizeCorrectionHighlights } from "@repo/validators";
import { sendEssayCorrectionAvailableEmail } from "@repo/email";
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
      essay_remaining_business_seconds,
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

  const latestReviewByEssay = new Map<
    string,
    "pending_review" | "returned_to_teacher"
  >();

  if (data.length > 0) {
    const { data: reviewSubmissions, error: reviewSubmissionsError } = await supabase
      .from("correction_review_submissions")
      .select("essay_id, round_number, status")
      .in(
        "essay_id",
        data.map((essay) => essay.id)
      )
      .in("status", ["pending_review", "returned_to_teacher"])
      .order("round_number", { ascending: false });

    if (reviewSubmissionsError) {
      console.error("Erro ao buscar estados de revisão das redações:", reviewSubmissionsError);
      return { essays: [], totalPages: 0, error: reviewSubmissionsError };
    }

    for (const submission of reviewSubmissions) {
      if (!latestReviewByEssay.has(submission.essay_id)) {
        latestReviewByEssay.set(
          submission.essay_id,
          submission.status as "pending_review" | "returned_to_teacher"
        );
      }
    }
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
      essay_remaining_business_seconds: Number(rest.essay_remaining_business_seconds),
      student_name: studentData.full_name,
      avatar_url: studentData.avatar_url,
      email: studentData.email,
      correction_review_status: latestReviewByEssay.get(rest.id) ?? null,
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

  const { data: motivationalTexts, error: motivationalTextsError } = await supabase
    .from("motivational_texts")
    .select("id, topic_id, text_number, body_text, image_url, source_reference")
    .eq("topic_id", essay.topic_id)
    .order("text_number", { ascending: true });

  if (motivationalTextsError) {
    console.error(
      `🚨 Erro ao buscar textos motivadores da redação (${id}):`,
      motivationalTextsError
    );
  }

  const normalizedMotivationalTexts = (motivationalTexts ?? []).map((text: MotivationalText) => {
    if (
      !text.image_url ||
      text.image_url.startsWith("http://") ||
      text.image_url.startsWith("https://")
    ) {
      return text;
    }

    const { data: publicUrlData } = supabase.storage.from("themes").getPublicUrl(text.image_url);

    return { ...text, image_url: publicUrlData.publicUrl };
  });

  const { student, ...essayData } = essay;

  return {
    ...essayData,
    student: student.full_name,
    motivational_texts: normalizedMotivationalTexts,
    motivational_texts_load_error: Boolean(motivationalTextsError),
  };
}

export async function getLatestCorrectionReviewState(essayId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: submission, error } = await supabase
    .from("correction_review_submissions")
    .select("id, payload, round_number, status")
    .eq("essay_id", essayId)
    .eq("teacher_id", user.id)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar submissão de revisão:", error);
    throw new Error("Não foi possível carregar a correção enviada para revisão.");
  }

  if (
    !submission ||
    !["pending_review", "returned_to_teacher"].includes(submission.status)
  ) {
    return null;
  }

  const validationResult = finalCorrectionSchema.safeParse(submission.payload);

  if (!validationResult.success) {
    console.error("Payload inválido na submissão de revisão:", {
      submission_id: submission.id,
      issues: validationResult.error.flatten(),
    });
    throw new Error("A correção enviada para revisão possui dados inválidos.");
  }

  let feedback: string | null = null;

  if (submission.status === "returned_to_teacher") {
    const { data: action, error: actionError } = await supabase
      .from("correction_review_actions")
      .select("feedback")
      .eq("submission_id", submission.id)
      .eq("action", "returned_to_teacher")
      .maybeSingle();

    if (actionError) {
      console.error("Erro ao buscar orientações da devolução:", actionError);
      throw new Error("Não foi possível carregar as orientações da revisão.");
    }

    feedback = action?.feedback ?? null;
  }

  return {
    id: submission.id,
    roundNumber: submission.round_number,
    status: submission.status as "pending_review" | "returned_to_teacher",
    payload: validationResult.data,
    feedback,
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

  const { data: teacherProfile, error: teacherProfileError } = await supabase
    .from("profiles")
    .select("correction_review_required")
    .eq("id", user.id)
    .single();

  if (teacherProfileError || !teacherProfile) {
    console.error("Erro ao verificar supervisão do professor:", teacherProfileError);
    return { success: false, error: "Não foi possível verificar o fluxo de correção." };
  }

  if (teacherProfile.correction_review_required) {
    const { data: submissionRows, error: submissionError } = await supabase.rpc(
      "submit_supervised_correction",
      {
        p_essay_id: essayId,
        p_payload: correction,
      }
    );

    const submission = (
      submissionRows as
        | {
            submission_id: string;
            round_number: number;
            status: "pending_review";
          }[]
        | null
    )?.[0];

    if (submissionError || !submission) {
      console.error("Erro ao enviar correção para revisão:", submissionError);
      return { success: false, error: "Não foi possível enviar a correção para revisão." };
    }

    revalidatePath("/inicio");
    revalidatePath("/redacoes-pendentes");
    revalidatePath(`/corrigir-redacao/${essayId}`);

    return {
      success: true,
      reviewRequired: true,
      message: "Correção enviada para revisão.",
      submission,
    };
  }

  const { data: transitionedEssay, error: transitionError } = await supabase
    .from("essays")
    .update({
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
    })
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
    .order("correction_date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

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
    best_essay_consent: data.best_essay_consent,
    highlights: normalizeCorrectionHighlights(data.highlights),
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
    mainBottleneck: data.main_bottleneck,
    nextEssayPriorities: data.next_essay_priorities ?? [],
    rewriteTasks: data.rewrite_tasks ?? [],
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

    const { data: claimedEssay, error: updateError } = await supabase
      .from("essays")
      .update({
        teacher_id: user.id,
        started_correction_at: new Date().toISOString(),
        status: "correcting",
      })
      .eq("id", essayId)
      .eq("status", "pending")
      .or(`teacher_id.is.null,teacher_id.eq.${user.id}`)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("🚨 Erro ao vincular professor:", updateError);
      return { success: false, error: "Erro ao iniciar correção." };
    }

    if (!claimedEssay) {
      const { data: currentEssay, error: currentEssayError } = await supabase
        .from("essays")
        .select("teacher_id, status")
        .eq("id", essayId)
        .maybeSingle();

      if (
        currentEssayError ||
        !currentEssay ||
        currentEssay.teacher_id !== user.id ||
        currentEssay.status !== "correcting"
      ) {
        console.error("🚨 Redação não atribuída ao professor atual:", currentEssayError);
        return { success: false, error: "A redação já foi assumida por outro corretor." };
      }
    }

    revalidatePath("/redacoes-pendentes");

    return { success: true };
  } catch (error) {
    console.error("🚨 Erro interno:", error);
    return { success: false, error: "Erro inesperado do servidor." };
  }
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
