import { createClient } from "@/lib/server";

export type EssayStatus = "pending" | "correcting" | "done" | "cancelled";
interface GetEssaysParams {
  status: EssayStatus;
  limit?: number;
}

export async function getEssaysByStatus({ status, limit }: GetEssaysParams) {
  const supabase = await createClient();

  let query = supabase
    .from("essays")
    .select(
      `
      id,
      title,
      created_at,
      student:profiles!essays_student_id_fkey(full_name)
    `
    )
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`🚨 Erro ao buscar redações (${status}):`, error);
    return [];
  }

  return data;
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

  const { data: motivationalTexts, error: textsError } = await supabase
    .from("motivational_texts")
    .select("*")
    .eq("topic_id", essay.topic_id);

  if (textsError) {
    console.error(
      `⚠️ Erro ao buscar textos motivadores para o tema ${essay.topic_id}:`,
      textsError
    );
  }

  return {
    ...essay,
    motivational_texts: motivationalTexts || [],
  };
}
