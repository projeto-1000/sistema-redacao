"use server";
import { createClient } from "@/lib/server";
import { CorrectionPayload } from "@repo/types";
import { revalidatePath } from "next/cache";

export async function saveEssayCorrection(essayId: string, payload: CorrectionPayload) {
  const supabase = await createClient();
  console.log({ essayId });
  console.log({ payload });
  // 1. Pegar o professor logado
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 2. Preparar os dados para o Supabase
  const { error } = await supabase
    .from("essays")
    .update({
      status: "done",
      teacher_id: user.id, // ID do professor atual
      correction_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Notas e Comentários
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
      highlights: payload.highlights, // O novo campo JSONB
    })
    .eq("id", essayId);

  if (error) throw error;
  console.log({ error });
  // 3. Revalidar as rotas para atualizar as listagens
  revalidatePath("/dashboard");
  revalidatePath(`/corrigir-redacao/${essayId}`);

  return { success: true };
}
