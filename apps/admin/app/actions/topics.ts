"use server";

import { createClient } from "@/lib/server";
import { EssayTopic, TopicsFilter } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";

interface GetTopicsParams {
  filters?: TopicsFilter;
  page?: number;
}

export async function getTopicsList({ filters, page = 1 }: GetTopicsParams = {}): Promise<{
  topics: EssayTopic[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const limit = 10;
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("essay_topics")
    .select("id, title, axis, active, source_type, source_year, created_at", { count: "exact" });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,axis_text.ilike.%${filters.search}%`);
  }

  if (filters?.axis && filters.axis !== "Todos") {
    query = query.eq("axis", filters.axis);
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar lista de temas:", error);
    return { topics: [], totalPages: 0, error };
  }

  return {
    topics: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
  };
}
