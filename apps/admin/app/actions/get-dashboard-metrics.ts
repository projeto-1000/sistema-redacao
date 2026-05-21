"use server";

import { createClient } from "@/lib/server";

// export async function getDashboardMetrics() {
//   const supabase = await createClient();

//   const now = new Date();

//   const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
//   const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

//   const { count: currentStudentsCount } = await supabase
//     .from("profiles")
//     .select("*", { count: "exact", head: true })
//     .eq("status", "active")
//     .eq("role", "STUDENT");

//   const { count: lastMonthStudentsCount } = await supabase
//     .from("profiles")
//     .select("*", { count: "exact", head: true })
//     .eq("status", "active")
//     .eq("role", "STUDENT")
//     .lt("created_at", startOfCurrentMonth);

//   const currentStudents = currentStudentsCount || 0;
//   const lastMonthStudents = lastMonthStudentsCount || 0;

//   let studentTrendPercentage = 0;
//   if (lastMonthStudents > 0) {
//     studentTrendPercentage = Math.round(
//       ((currentStudents - lastMonthStudents) / lastMonthStudents) * 100
//     );
//   } else if (currentStudents > 0) {
//     studentTrendPercentage = 100;
//   }

//   const { count: pendingEssaysCount } = await supabase
//     .from("essays")
//     .select("*", { count: "exact", head: true })
//     .eq("status", "pending");

//   const { count: currentMonthEssays } = await supabase
//     .from("essays")
//     .select("*", { count: "exact", head: true })
//     .gte("created_at", startOfCurrentMonth);

//   const { count: lastMonthEssays } = await supabase
//     .from("essays")
//     .select("*", { count: "exact", head: true })
//     .gte("created_at", startOfLastMonth)
//     .lt("created_at", startOfCurrentMonth);

//   const currentEssays = currentMonthEssays || 0;
//   const pastEssays = lastMonthEssays || 0;

//   let essayTrendPercentage = 0;
//   if (pastEssays > 0) {
//     essayTrendPercentage = Math.round(((currentEssays - pastEssays) / pastEssays) * 100);
//   } else if (currentEssays > 0) {
//     essayTrendPercentage = 100;
//   }

//   const isStudentTrendPositive = studentTrendPercentage >= 0;
//   const isEssayTrendPositive = essayTrendPercentage >= 0;

//   return {
//     students: {
//       total: currentStudents,
//       trend: `${isStudentTrendPositive ? "+" : ""}${studentTrendPercentage}% este mês`,
//       isPositive: isStudentTrendPositive,
//     },
//     essays: {
//       total: pendingEssaysCount || 0,
//       trend: `${isEssayTrendPositive ? "+" : ""}${essayTrendPercentage}% envios (vs. mês anterior)`,
//       isPositive: isEssayTrendPositive,
//     },
//   };
// }

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_dashboard_metrics");

  if (error || !data) {
    console.error("Erro ao invocar RPC de métricas:", error);
    return {
      students: { total: 0, trend: "0% este mês", isPositive: true },
      plans: { total: 0, trend: "0% este mês", isPositive: true },
      essays: { total: 0, trend: "0 envios", isPositive: true },
    };
  }

  const calculateTrend = (current: number, past: number) => {
    const percentage =
      past > 0 ? Math.round(((current - past) / past) * 100) : current > 0 ? 100 : 0;

    return {
      text: `${percentage >= 0 ? "+" : ""}${percentage}%`,
      isPositive: percentage >= 0,
    };
  };

  const studentTrend = calculateTrend(data.current_students, data.last_month_students);
  const essayTrend = calculateTrend(data.current_essays, data.last_month_essays);
  const planTrend = calculateTrend(data.current_plans, data.last_month_plans);

  return {
    students: {
      total: data.current_students,
      trend: `${studentTrend.text} este mês`,
      isPositive: studentTrend.isPositive,
    },
    plans: {
      total: data.current_plans,
      trend: `${planTrend.text} este mês`,
      isPositive: planTrend.isPositive,
    },
    essays: {
      total: data.pending_essays,
      trend: `${essayTrend.text} envios (vs. mês anterior)`,
      isPositive: essayTrend.isPositive,
    },
  };
}
