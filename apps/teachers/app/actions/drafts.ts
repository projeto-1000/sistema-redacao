"use server";

import { createClient } from "@/lib/server";
import { CorrectionPayload } from "@repo/types";
import {
  draftCorrectionCommentsSchema,
  normalizeCorrectionHighlights,
} from "@repo/validators";

function normalizeDraft(payload: CorrectionPayload): CorrectionPayload {
  return {
    ...payload,
    highlights: normalizeCorrectionHighlights(payload.highlights),
  };
}

function normalizeDraftForSave(payload: CorrectionPayload) {
  const commentsResult = draftCorrectionCommentsSchema.safeParse(
    payload.comments
  );

  if (!commentsResult.success) return null;

  return normalizeDraft({
    ...payload,
    comments: commentsResult.data,
  });
}

export async function autoSaveDraft(essayId: string, payload: CorrectionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const draft = normalizeDraftForSave(payload);
  if (!draft) {
    return {
      success: false,
      error: "Os comentários das competências devem ter no máximo 1.000 caracteres.",
    };
  }

  const { error } = await supabase.from("correction_drafts").upsert(
    {
      essay_id: essayId,
      teacher_id: user.id,
      payload: draft,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "essay_id" }
  );

  if (error) {
    console.error("Erro no auto-save:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveCorrectionDraft(essayId: string, payload: CorrectionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const draft = normalizeDraftForSave(payload);
  if (!draft) {
    console.error(
      "Draft inválido: os comentários das competências excedem 1.000 caracteres."
    );
    return;
  }

  await supabase.from("correction_drafts").upsert({
    essay_id: essayId,
    teacher_id: user.id,
    payload: draft,
  });
}

export async function getCorrectionDraft(essayId: string): Promise<CorrectionPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("correction_drafts")
    .select("payload")
    .eq("essay_id", essayId)
    .eq("teacher_id", user.id)
    .single();

  if (error) return null;

  return normalizeDraft(data.payload as CorrectionPayload);
}
