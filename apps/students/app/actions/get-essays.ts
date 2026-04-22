import { createClient } from "@/lib/server";
import { EssayListItem, EssaysFilter } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

interface GetEssaysParams {
  filters?: EssaysFilter;
  page?: number;
  limit?: number;
}

export async function getStudentEssays({
  filters,
  page = 1,
  limit = 10,
}: GetEssaysParams = {}): Promise<{
  essays: EssayListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("essays")
    .select("id, title, submission_date, status, total_score, thematic_axis, topic_id", {
      count: "exact",
    })
    .eq("student_id", user.id);

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,thematic_axis.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.thematicAxis && filters.thematicAxis !== "all") {
    query = query.eq("thematic_axis", filters.thematicAxis);
  }

  if (filters?.totalScore && filters.totalScore !== "all") {
    const [min, max] = filters.totalScore.split("-");
    query = query
      .gte("total_score", parseInt(min || "0"))
      .lte("total_score", parseInt(max || "1000"));
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

  return {
    essays: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error || null,
  };
}

export async function getEssayById(essayId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: essay, error } = await supabase
    .from("essays")
    .select("*")
    .eq("id", essayId)
    .eq("student_id", user.id)
    .single();

  if (error || !essay) {
    console.error("Redação não encontrada ou acesso negado");
    return null;
  }

  return {
    correctedAt: essay.correction_date,
    title: essay.title,
    totalScore: essay.total_score,
    text: essay.content,
    highlights: essay.highlights || [],
    scores: {
      c1: essay.score_c1,
      c2: essay.score_c2,
      c3: essay.score_c3,
      c4: essay.score_c4,
      c5: essay.score_c5,
    },
    comments: {
      c1: essay.comment_c1,
      c2: essay.comment_c2,
      c3: essay.comment_c3,
      c4: essay.comment_c4,
      c5: essay.comment_c5,
    },
    generalComment: essay.general_comment,
  };
}
