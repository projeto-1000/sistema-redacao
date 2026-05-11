"use server";

import { createClient } from "@/lib/server";
import { CorrectionPayload } from "@repo/types";

export async function autoSaveDraft(essayId: string, payload: CorrectionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("correction_drafts").upsert(
    {
      essay_id: essayId,
      teacher_id: user.id,
      payload: payload,
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

  await supabase.from("correction_drafts").upsert({
    essay_id: essayId,
    teacher_id: user.id,
    payload,
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

  return data.payload as CorrectionPayload;
}
