"use server";

import { createClient } from "@/lib/server";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
} from "@/lib/integrations/datacrazy/sync-student";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionState = {
  error?: string;
} | null;

export async function submitEssay(
  topic_id: string,
  title: string,
  axis: string,
  prevState: ActionState,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado para enviar." };
  }

  const content = formData.get("content") as string;

  //TODO: definir caracteres mínimos
  if (!content || content.length < 100) {
    return { error: "A redação está muito curta. Mínimo de 100 caracteres." };
  }

  try {
    const { error } = await supabase.rpc("submit_essay", {
      p_student_id: user.id,
      p_topic_id: topic_id,
      p_title: title,
      p_thematic_axis: axis,
      p_content: content,
    });

    if (error) {
      console.error("Erro RPC:", error);
      return { error: error.message };
    }
  } catch (err) {
    console.error("Erro catch:", err);
    return { error: "Erro interno ao enviar redação." };
  }

  try {
    await syncStudentToDataCrazy(user.id, "essay_status_updated");
  } catch (error) {
    console.error("[DATACRAZY_SYNC_ERROR]", {
      user_id: user.id,
      event: "essay_status_updated",
      error_code: getDataCrazySyncErrorCode(error),
    });
  }

  revalidatePath("/minhas-redacoes");
  revalidatePath("/inicio");
  redirect(`/minhas-redacoes/nova-redacao?id=${topic_id}&success=true`);
}
