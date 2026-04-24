import { UserData } from "@repo/types";
import { createClient } from "@/lib/server";

export async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, statsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, credits_balance, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase.from("student_performance_stats").select("*").eq("student_id", user.id).maybeSingle(),
    supabase
      .from("essays")
      .select("created_at, total_score")
      .eq("student_id", user.id)
      .eq("status", "corrected")
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const stats = statsRes.data;

  const { data: evolutionGraph } = await supabase.rpc("get_student_evolution", {
    p_user_id: user.id,
    p_months_count: 6,
  });

  return {
    user: {
      name: profile?.full_name || user.user_metadata?.full_name || "Estudante",
      email: user.email,
      credits: profile?.credits_balance ?? 0,
      avatarUrl: profile?.avatar_url || null,
    } as UserData,
    competencies: {
      C1: Math.round(stats?.avg_c1 || 0),
      C2: Math.round(stats?.avg_c2 || 0),
      C3: Math.round(stats?.avg_c3 || 0),
      C4: Math.round(stats?.avg_c4 || 0),
      C5: Math.round(stats?.avg_c5 || 0),
    },
    evolution:
      evolutionGraph?.map((item: { month_text: string; average_score: number }) => ({
        month: item.month_text,
        score: item.average_score,
      })) || [],
    globalStats: {
      totalEssays: stats?.total_essays || 0,
      averageScore: Math.round(stats?.average_total_score || 0),
      bestScore: stats?.best_score || 0,
      lastScore: stats?.last_score,
      bestCompetence: stats?.best_competence,
      scoreTrend: stats?.score_trend || 0,
      essaysTrend: stats?.essays_trend || 0,
    },
    hasData: (stats?.total_essays || 0) > 0,
  };
}
