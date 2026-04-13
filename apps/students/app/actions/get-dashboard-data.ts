import { createClient } from "@/lib/server";
import { formatMonth, getFirstName } from "@repo/utils";

export async function getStudentProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, credits_balance")
    .eq("id", userId)
    .single();

  return {
    firstName: getFirstName(data?.full_name || "Estudante"),
    credits: data?.credits_balance ?? 0,
  };
}

export async function getStudentMetrics(userId: string) {
  const supabase = await createClient();
  const { data: stats } = await supabase
    .from("student_performance_stats")
    .select("*")
    .eq("student_id", userId)
    .maybeSingle();

  return {
    averageScore: Math.round(stats.average_total_score),
    bestScore: stats.best_score,
    lastScore: stats.last_score,
    totalEssays: stats.total_essays,
    competenceScores: {
      C1: Math.round(stats.avg_c1),
      C2: Math.round(stats.avg_c2),
      C3: Math.round(stats.avg_c3),
      C4: Math.round(stats.avg_c4),
      C5: Math.round(stats.avg_c5),
    },
  };
}

export async function getStudentHistory(userId: string) {
  const supabase = await createClient();
  const { data: history } = await supabase
    .from("essays")
    .select("created_at, total_score")
    .eq("student_id", userId)
    .eq("status", "corrected")
    .order("created_at", { ascending: true });

  const list = history || [];

  return {
    hasHistory: list.length > 1,
    evolutionData: list.map((item) => ({
      month: formatMonth(item.created_at),
      score: item.total_score || 0,
    })),
  };
}
