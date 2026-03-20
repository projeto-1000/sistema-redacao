import { createClient } from "@/lib/server";

export type EssayStatus = "pending" | "correcting" | "done" | "cancelled" | "expired";

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
