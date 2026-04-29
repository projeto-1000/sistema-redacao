"use server";

import { GetStudentsFilters, StudentsListItem } from "@/app/types";
import { createClient } from "@/lib/server";
import { PostgrestError } from "@supabase/supabase-js";

interface GetStudentsFiltersParams {
  filters?: GetStudentsFilters;
  page?: number;
  limit?: number;
}

export async function getStudents({
  filters,
  page = 1,
  limit = 10,
}: GetStudentsFiltersParams = {}): Promise<{
  students: StudentsListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
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

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar lista de alunos:", error);
    return { students: [], totalPages: 0, error };
  }

  return {
    students: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error,
  };
}
