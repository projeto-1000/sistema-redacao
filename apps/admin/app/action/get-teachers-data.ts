"use server";

import { createClient } from "@/lib/server";
import { GetTeachersFilters, TeacherListItem } from "../types";
import { revalidatePath } from "next/cache";

export async function getTeachers(
  filters: GetTeachersFilters,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("teacher_stats_view")
    .select(`id, full_name, email, status, avatar_url, total, currentMonth`, { count: "exact" });

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, count, error } = await query
    .order("full_name", { ascending: true })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar professores:", error);
    return { data: [], totalPages: 0 };
  }

  return {
    data: data as TeacherListItem[],
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function updateTeacherStatus(teacherId: string, currentStatus: string) {
  const supabase = await createClient();

  // Se estiver ativo, bloqueia. Se estiver qualquer outra coisa (bloqueado/inativo), ativa.
  const newStatus = currentStatus === "active" ? "blocked" : "active";

  // ⚠️ Importante: Atualizamos a tabela original "profiles", e não a View!
  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", teacherId)
    .eq("role", "TEACHER"); // Garantia extra de segurança

  if (error) {
    console.error("Erro ao alterar status do professor:", error.message);
    return { error: error.message };
  }

  revalidatePath("/professores");

  return { success: true };
}
