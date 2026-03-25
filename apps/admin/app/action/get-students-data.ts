"use server";

import { createClient } from "@/lib/server";
import { StudentListItem } from "../types";
import { revalidatePath } from "next/cache";

type GetStudentsFilters = {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
};

export async function getStudentsCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "STUDENT");

  if (error) {
    console.error("Erro ao contar alunos:", error);
    return 0;
  }

  return count || 0;
}

export async function getStudentsList(
  filters?: GetStudentsFilters,
  page: number = 1,
  limit: number = 10
): Promise<{ data: StudentListItem[]; totalPages: number }> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("profiles")
    .select(`id, full_name, email, status, avatar_url`, { count: "exact" })
    .eq("role", "STUDENT");

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // if (filters?.plan && filters.plan !== "all") {
  //   query = query.eq("plan", filters.plan);
  // }

  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }

  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar lista de alunos:", error);
    return { data: [], totalPages: 0 };
  }

  return {
    data: data as StudentListItem[],
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function updateStudentStatus(studentId: string, currentStatus: string) {
  console.log("🟡 Iniciando atualização para o aluno:", studentId, "Status atual:", currentStatus);

  const supabase = await createClient();
  const newStatus = currentStatus === "active" ? "blocked" : "active";

  // O .select() no final é crucial: ele força o Supabase a devolver a linha alterada.
  // Se o RLS bloquear, ele devolve erro ou um array vazio.
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", studentId)
    .select();

  if (error) {
    console.error("❌ ERRO DO SUPABASE:", error.message, error.details);
    throw new Error(error.message);
  }

  // Se o RLS bloqueou silenciosamente, o data vem vazio
  if (!data || data.length === 0) {
    console.error("❌ ERRO RLS: Nenhuma linha foi atualizada. Verifique as políticas do Supabase!");
    throw new Error("Bloqueado por RLS ou aluno não encontrado.");
  }

  console.log("✅ Atualizado com sucesso no banco:", data);
  revalidatePath("/alunos"); // Força a tela a buscar os dados novos
}
