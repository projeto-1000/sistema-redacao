import { createClient } from "@/lib/server";
import { formatDate, formatMonth, getFirstName } from "@repo/utils";

export async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, statsRes, recentRes, historyRes] = await Promise.all([
    supabase.from("profiles").select("full_name, credits_balance").eq("id", user.id).single(),
    supabase.from("student_performance_stats").select("*").eq("student_id", user.id).maybeSingle(),
    supabase
      .from("essays")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("essays")
      .select("created_at, total_score")
      .eq("student_id", user.id)
      .eq("status", "corrected")
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const stats = statsRes.data;
  const recentEssays = recentRes.data || [];
  const history = historyRes.data || [];

  console.log(stats);

  const lastGradedEssay = recentEssays.find((essay) => essay.status === "corrected");

  return {
    user: {
      firstName: getFirstName(profile?.full_name || user.user_metadata?.full_name || "Estudante"),
      credits: profile?.credits_balance ?? 0,
    },
    metrics: {
      hasData: !!stats,
      averageScore: Math.round(stats?.average_total_score || 0),
      lastScore: lastGradedEssay?.total_score || 0,
      bestScore: stats?.best_score || 0,
    },
    charts: {
      competenceScores: {
        C1: Math.round(stats?.avg_c1 || 0),
        C2: Math.round(stats?.avg_c2 || 0),
        C3: Math.round(stats?.avg_c3 || 0),
        C4: Math.round(stats?.avg_c4 || 0),
        C5: Math.round(stats?.avg_c5 || 0),
      },
      evolutionData: history.map((item) => ({
        month: formatMonth(item.created_at),
        score: item.total_score || 0,
      })),
      hasHistory: history.length > 1,
      hasEssays: (stats?.total_essays || 0) > 0,
    },
    recentEssays: {
      hasEssays: recentEssays.length > 0,
      list: recentEssays.map((essay) => ({
        id: essay.id,
        title: essay.title,
        date: formatDate(essay.submission_date, "short"),
        status: essay.status as "pending" | "corrected",
        score: essay.total_score ?? undefined,
      })),
    },
  };
}
