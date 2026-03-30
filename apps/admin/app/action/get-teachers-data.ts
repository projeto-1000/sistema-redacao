"use server";

import { createClient } from "@/lib/server";
import { TeachersListItem } from "../types";

export async function getTeachers(
  page: number = 1,
  limit: number = 10,
  searchQuery: string = "",
  statusFilter: string = "all"
) {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("teacher_stats_view")
    .select(`id, full_name, email, status, avatar_url, total, currentMonth`, { count: "exact" });
  // .eq("role", "TEACHER");

  // const test = supabase.from("profiles");

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }

  if (statusFilter !== "all" && statusFilter !== "") {
    query = query.eq("status", statusFilter);
  }

  const { data, count, error } = await query
    .order("full_name", { ascending: true })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar professores:", error);
    return { data: [], totalPages: 0 };
  }

  return {
    data: data as TeachersListItem[],
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}
