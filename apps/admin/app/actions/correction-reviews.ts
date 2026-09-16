"use server";

import { createClient } from "@/lib/server";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
} from "@/lib/integrations/datacrazy/sync-student";
import { sendEssayCorrectionAvailableEmail } from "@repo/email";
import type { CorrectionPayload, EssayStatus, MotivationalText } from "@repo/types";
import { finalCorrectionSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

// type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface ReviewEssayRelation {
  id: string;
  title: string;
  content: string;
  created_at: string;
  status: EssayStatus;
  topic_id: string;
  student: { full_name: string } | null;
}

interface ReviewListEssayRelation {
  title: string;
  student: { full_name: string } | null;
}

interface ReviewTeacherRelation {
  id: string;
  full_name: string;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface CorrectionApprovalResult {
  essay_id: string;
  submission_id: string;
  status: "approved" | "approved_with_changes";
}

interface CorrectionReturnResult {
  essay_id: string;
  submission_id: string;
  status: "returned_to_teacher";
}

export interface PendingCorrectionReviewListItem {
  id: string;
  essayTitle: string;
  studentName: string;
  teacherName: string;
  roundNumber: number;
  submittedAt: string;
}

export interface PendingCorrectionReviewDetails {
  id: string;
  roundNumber: number;
  submittedAt: string;
  teacher: {
    id: string;
    name: string;
  };
  essay: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    status: EssayStatus;
    studentName: string;
    motivationalTexts: MotivationalText[];
    motivationalTextsLoadError: boolean;
  };
  payload: CorrectionPayload;
}

async function runCorrectionApprovalEffects(
  supabase: SupabaseClient,
  approval: CorrectionApprovalResult
) {
  const { data: essay, error: essayError } = await supabase
    .from("essays")
    .select(
      `
        student_id,
        title,
        student:profiles!essays_student_id_fkey(full_name, email)
      `
    )
    .eq("id", approval.essay_id)
    .maybeSingle();

  if (essayError || !essay) {
    console.error("[CORRECTION_REVIEW_EFFECTS_DATA_ERROR]", {
      essay_id: approval.essay_id,
      submission_id: approval.submission_id,
      error: essayError,
    });
    return;
  }

  try {
    await syncStudentToDataCrazy(essay.student_id, "essay_status_updated");
  } catch (error) {
    console.error("[DATACRAZY_SYNC_ERROR]", {
      essay_id: approval.essay_id,
      student_id: essay.student_id,
      event: "essay_status_updated",
      error_code: getDataCrazySyncErrorCode(error),
    });
  }

  const student = essay.student as unknown as {
    full_name: string | null;
    email: string | null;
  } | null;

  if (student?.email) {
    try {
      await sendEssayCorrectionAvailableEmail({
        to: student.email,
        studentName: student.full_name,
        essayId: approval.essay_id,
        essayTitle: essay.title,
      });
    } catch (error) {
      console.error("[ESSAY_CORRECTION_EMAIL_ERROR]", {
        essay_id: approval.essay_id,
        student_id: essay.student_id,
        error,
      });
    }
  } else {
    console.warn("[ESSAY_CORRECTION_EMAIL_SKIPPED]", {
      essay_id: approval.essay_id,
      student_id: essay.student_id,
      reason: "missing_student_email",
    });
  }
}

function revalidateCorrectionReviewPaths(submissionId: string) {
  revalidatePath("/inicio");
  revalidatePath("/redacoes-pendentes");
  revalidatePath("/redacoes-corrigidas");
  revalidatePath(`/redacoes-pendentes/revisoes/${submissionId}`);
}

export async function getPendingCorrectionReviews({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{
  reviews: PendingCorrectionReviewListItem[];
  totalCount: number;
  totalPages: number;
  error: string | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  const { data, count, error } = await supabase
    .from("correction_review_submissions")
    .select(
      `
        id,
        round_number,
        submitted_at,
        essay:essays!correction_review_submissions_essay_id_fkey(
          title,
          student:profiles!essays_student_id_fkey(full_name)
        ),
        teacher:profiles!correction_review_submissions_teacher_id_fkey(
          full_name
        )
      `,
      { count: "exact" }
    )
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao carregar fila de revisão de correções:", error);
    return {
      reviews: [],
      totalCount: 0,
      totalPages: 0,
      error: "Não foi possível carregar a fila de revisões.",
    };
  }

  const reviews = data.map((submission) => {
    const essay = submission.essay as unknown as ReviewListEssayRelation;
    const teacher = submission.teacher as unknown as Pick<ReviewTeacherRelation, "full_name">;

    return {
      id: submission.id,
      essayTitle: essay.title,
      studentName: essay.student?.full_name ?? "Aluno não identificado",
      teacherName: teacher.full_name,
      roundNumber: submission.round_number,
      submittedAt: submission.submitted_at,
    };
  });

  return {
    reviews,
    totalCount: count ?? 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
  };
}

export async function approveSupervisedCorrection(submissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: approvalRows, error: approvalError } = await supabase.rpc(
    "approve_supervised_correction",
    { p_submission_id: submissionId }
  );

  const approval = (approvalRows as CorrectionApprovalResult[] | null)?.[0];

  if (approvalError || !approval) {
    console.error("Erro ao aprovar correção supervisionada:", approvalError);
    return {
      success: false,
      error: "Não foi possível aprovar a correção. Atualize a página e tente novamente.",
    };
  }

  await runCorrectionApprovalEffects(supabase, approval);
  revalidateCorrectionReviewPaths(submissionId);

  return { success: true };
}

export async function approveSupervisedCorrectionWithChanges(
  submissionId: string,
  payload: CorrectionPayload
): Promise<{
  success: boolean;
  error?: string;
}> {
  const validationResult = finalCorrectionSchema.safeParse(payload);

  if (!validationResult.success) {
    console.error(
      "Dados inválidos ao aprovar correção supervisionada com alterações:",
      validationResult.error.flatten()
    );

    return {
      success: false,
      error: "Preencha corretamente todos os campos obrigatórios antes de aprovar.",
    };
  }

  const supabase = await createClient();
  const { data: approvalRows, error: approvalError } = await supabase.rpc(
    "approve_supervised_correction_with_changes",
    {
      p_submission_id: submissionId,
      p_payload: validationResult.data,
    }
  );

  const approval = (approvalRows as CorrectionApprovalResult[] | null)?.[0];

  if (approvalError || !approval) {
    console.error("Erro ao aprovar correção supervisionada com alterações:", approvalError);

    if (approvalError?.message.includes("does not contain any review changes")) {
      return {
        success: false,
        error: "Nenhuma alteração foi feita na correção.",
      };
    }

    return {
      success: false,
      error: "Não foi possível aprovar a correção com alterações.",
    };
  }

  await runCorrectionApprovalEffects(supabase, approval);
  revalidateCorrectionReviewPaths(submissionId);

  return { success: true };
}

export async function returnSupervisedCorrectionToTeacher(
  submissionId: string,
  feedback: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const normalizedFeedback = feedback.trim();

  if (!normalizedFeedback) {
    return {
      success: false,
      error: "Informe ao professor o que precisa ser ajustado.",
    };
  }

  const supabase = await createClient();
  const { data: returnRows, error: returnError } = await supabase.rpc(
    "return_supervised_correction_to_teacher",
    {
      p_submission_id: submissionId,
      p_feedback: normalizedFeedback,
    }
  );

  const returnedSubmission = (returnRows as CorrectionReturnResult[] | null)?.[0];

  if (returnError || !returnedSubmission) {
    console.error("Erro ao devolver correção supervisionada ao professor:", returnError);
    return {
      success: false,
      error: "Não foi possível devolver a correção ao professor.",
    };
  }

  revalidateCorrectionReviewPaths(submissionId);

  return { success: true };
}

export async function getPendingCorrectionReview(
  submissionId: string
): Promise<PendingCorrectionReviewDetails | null> {
  const supabase = await createClient();

  const { data: submission, error } = await supabase
    .from("correction_review_submissions")
    .select(
      `
        id,
        round_number,
        submitted_at,
        payload,
        essay:essays!correction_review_submissions_essay_id_fkey(
          id,
          title,
          content,
          created_at,
          status,
          topic_id,
          student:profiles!essays_student_id_fkey(full_name)
        ),
        teacher:profiles!correction_review_submissions_teacher_id_fkey(
          id,
          full_name
        )
      `
    )
    .eq("id", submissionId)
    .eq("status", "pending_review")
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar correção para revisão:", error);
    throw new Error("Não foi possível carregar a correção para revisão.");
  }

  if (!submission) {
    return null;
  }

  const payloadResult = finalCorrectionSchema.safeParse(submission.payload);

  if (!payloadResult.success) {
    console.error("Payload inválido na correção aguardando revisão:", {
      submissionId: submission.id,
      issues: payloadResult.error.flatten(),
    });
    throw new Error("A correção enviada pelo professor possui dados inválidos.");
  }

  const essay = submission.essay as unknown as ReviewEssayRelation;
  const teacher = submission.teacher as unknown as ReviewTeacherRelation;

  const { data: motivationalTexts, error: motivationalTextsError } = await supabase
    .from("motivational_texts")
    .select("id, topic_id, text_number, body_text, image_url, source_reference")
    .eq("topic_id", essay.topic_id)
    .order("text_number", { ascending: true });

  if (motivationalTextsError) {
    console.error(
      `Erro ao buscar textos motivadores da redação (${essay.id}):`,
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

  return {
    id: submission.id,
    roundNumber: submission.round_number,
    submittedAt: submission.submitted_at,
    teacher: {
      id: teacher.id,
      name: teacher.full_name,
    },
    essay: {
      id: essay.id,
      title: essay.title,
      content: essay.content,
      createdAt: essay.created_at,
      status: essay.status,
      studentName: essay.student?.full_name ?? "Aluno não identificado",
      motivationalTexts: normalizedMotivationalTexts,
      motivationalTextsLoadError: Boolean(motivationalTextsError),
    },
    payload: payloadResult.data,
  };
}
