"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
} from "@/lib/integrations/datacrazy/sync-student";
import { ESSAY_SOURCE_BUCKET } from "@/lib/essay-source-files";
import { deleteEssaySources } from "@/lib/server/essay-source-storage";

type EssayPayload = {
  student_id: string;
  topic_id: string;
  title: string;
  thematic_axis: string;
  content: string;
  best_essay_consent: boolean;
  pedagogical_use_consent: boolean;
  source_file_id: string | null;
  status: string;
  updated_at: string;
  created_at?: string;
};

export async function saveTemporaryBackup(
  themeId: string,
  content: string,
  sourceFileId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("essay_backups").upsert(
    {
      user_id: user.id,
      theme_id: themeId,
      content,
      source_file_id: sourceFileId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,theme_id" }
  );

  if (error) {
    console.error("🚨 Falha ao salvar backup temporário:", error.message, error.details);
    throw new Error("Erro no auto-save do rascunho");
  }
}

export async function saveDraft(
  topicId: string,
  content: string,
  title: string,
  thematicAxis: string,
  pedagogicalUseConsent: boolean,
  sourceFileId: string | null,
  draftId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const essayData: EssayPayload = {
    student_id: user.id,
    topic_id: topicId,
    title: title,
    thematic_axis: thematicAxis,
    content: content,
    best_essay_consent: pedagogicalUseConsent,
    pedagogical_use_consent: pedagogicalUseConsent,
    source_file_id: sourceFileId,
    status: "draft",
    updated_at: new Date().toISOString(),
  };

  let dbError = null;
  let createdNewDraft = false;

  if (draftId) {
    const { error } = await supabase
      .from("essays")
      .update(essayData)
      .eq("id", draftId)
      .eq("student_id", user.id);

    dbError = error;
  } else {
    essayData.created_at = new Date().toISOString();

    const { error } = await supabase.from("essays").insert(essayData);

    dbError = error;

    if (!error) {
      createdNewDraft = true;
    }
  }

  await supabase.from("essay_backups").delete().eq("user_id", user.id).eq("theme_id", topicId);

  if (dbError) {
    console.error("Erro no banco:", dbError);
    throw dbError;
  }

  if (createdNewDraft) {
    try {
      await syncStudentToDataCrazy(user.id, "essay_status_updated");
    } catch (error) {
      console.error("[DATACRAZY_SYNC_ERROR]", {
        user_id: user.id,
        event: "essay_status_updated",
        error_code: getDataCrazySyncErrorCode(error),
      });
    }
  }

  revalidatePath("/minhas-redacoes", "layout");
  return { success: true };
}

export async function getTemporaryBackup(themeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("essay_backups")
    .select("content, updated_at, source_file_id")
    .eq("user_id", user.id)
    .eq("theme_id", themeId)
    .maybeSingle();

  return data;
}

export async function deleteDraftEssay(essayId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: deletedEssay, error } = await supabase
    .from("essays")
    .delete()
    .eq("id", essayId)
    .eq("student_id", user.id)
    .select("topic_id, source_file_id")
    .single();

  if (error) {
    console.error("Erro ao deletar rascunho:", error);
    throw new Error("Falha ao excluir o rascunho.");
  }

  if (deletedEssay?.topic_id) {
    await supabase
      .from("essay_backups")
      .delete()
      .eq("user_id", user.id)
      .eq("theme_id", deletedEssay.topic_id);
  }

  if (deletedEssay?.source_file_id) {
    const { data: deletedSource } = await supabase
      .from("essay_source_files")
      .delete()
      .eq("id", deletedEssay.source_file_id)
      .eq("student_id", user.id)
      .select("storage_path, storage_provider")
      .maybeSingle();

    if (deletedSource) {
      if (deletedSource.storage_provider === "r2") {
        await deleteEssaySources([deletedSource.storage_path]);
      } else {
        await supabase.storage.from(ESSAY_SOURCE_BUCKET).remove([deletedSource.storage_path]);
      }
    }
  }

  revalidatePath("/minhas-redacoes", "layout");

  return { success: true, topicId: deletedEssay?.topic_id };
}

export async function getDraftEssay(topicId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("essays")
    .select("id, content, updated_at, best_essay_consent, pedagogical_use_consent, source_file_id")
    .eq("student_id", user.id)
    .eq("topic_id", topicId)
    .eq("status", "draft")
    .maybeSingle();

  return data;
}
