"use server";

import { createClient } from "@/lib/server";
import { EssayTopic, EssayTopicDetail, MotivationalText, TopicsFilter } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";

interface GetTopicsParams {
  filters?: TopicsFilter;
  page?: number;
  limit?: number;
}

export async function getTopicsList({
  filters,
  page = 1,
  limit = 10,
}: GetTopicsParams = {}): Promise<{
  topics: EssayTopic[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  try {
    const supabase = await createClient();

    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;

    let query = supabase
      .from("essay_topics")
      .select("id, title, axis, created_at", { count: "exact" })
      .eq("active", true);

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,axis_text.ilike.%${filters.search}%`);
    }

    if (filters?.axis && filters.axis !== "Todos") {
      query = query.eq("axis", filters.axis);
    }

    const { data, count, error } = await query
      .range(rangeStart, rangeEnd)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      topics: data as EssayTopic[],
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: null,
    };
  } catch (error) {
    console.error("Erro ao buscar temas:", error);
    return {
      topics: [],
      totalPages: 0,
      error: error as PostgrestError,
    };
  }
}

export async function getTopicDetails(id: string): Promise<EssayTopicDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("essay_topics")
    .select(
      `
      *,
      motivational_texts (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar detalhes do tema:", error);
    return null;
  }
  if (!data) return null;

  if (data.motivational_texts) {
    data.motivational_texts = data.motivational_texts.map((text: MotivationalText) => {
      if (!text.image_url || text.image_url.startsWith("http")) return text;

      const { data: publicUrlData } = supabase.storage.from("themes").getPublicUrl(text.image_url);

      return { ...text, image_url: publicUrlData.publicUrl };
    });

    data.motivational_texts.sort(
      (a: MotivationalText, b: MotivationalText) => a.text_number - b.text_number
    );
  }

  return data as EssayTopicDetail;
}
