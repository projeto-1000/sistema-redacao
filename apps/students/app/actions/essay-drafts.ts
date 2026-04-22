"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function saveTemporaryBackup(themeId: string, content: string) {
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
  draftId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const essayData: any = {
    student_id: user.id,
    topic_id: topicId,
    title: title,
    thematic_axis: thematicAxis,
    content: content,
    status: "draft",
    created_at: new Date().toISOString(),
  };

  // Se recebemos o draftId, nós injetamos ele no objeto!
  if (draftId) {
    essayData.id = draftId;
  }

  const { error } = await supabase.from("essays").upsert(essayData, { onConflict: "id" });

  await supabase.from("essay_backups").delete().eq("user_id", user.id).eq("theme_id", topicId);

  if (error) {
    console.error("Erro no banco:", error);
    throw error;
  }

  revalidatePath("/minhas-redacoes");
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
    .select("content, updated_at")
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

  const { error } = await supabase
    .from("essays")
    .delete({ count: "exact" })
    .eq("id", essayId)
    .eq("student_id", user.id);

  if (error) {
    console.error("Erro ao deletar rascunho:", error);
    throw new Error("Falha ao excluir o rascunho.");
  }

  revalidatePath("/minhas-redacoes");

  return { success: true };
}
