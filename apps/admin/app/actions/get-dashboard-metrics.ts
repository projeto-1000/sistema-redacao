"use server";

import { createClient } from "@/lib/server";

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const now = new Date();

  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const { count: currentStudentsCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("role", "STUDENT");

  const { count: lastMonthStudentsCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("role", "STUDENT")
    .lt("created_at", startOfCurrentMonth);

  const currentStudents = currentStudentsCount || 0;
  const lastMonthStudents = lastMonthStudentsCount || 0;

  let studentTrendPercentage = 0;
  if (lastMonthStudents > 0) {
    studentTrendPercentage = Math.round(
      ((currentStudents - lastMonthStudents) / lastMonthStudents) * 100
    );
  } else if (currentStudents > 0) {
    studentTrendPercentage = 100;
  }

  const { count: pendingEssaysCount } = await supabase
    .from("essays")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: currentMonthEssays } = await supabase
    .from("essays")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfCurrentMonth);

  const { count: lastMonthEssays } = await supabase
    .from("essays")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfLastMonth)
    .lt("created_at", startOfCurrentMonth);

  const currentEssays = currentMonthEssays || 0;
  const pastEssays = lastMonthEssays || 0;

  let essayTrendPercentage = 0;
  if (pastEssays > 0) {
    essayTrendPercentage = Math.round(((currentEssays - pastEssays) / pastEssays) * 100);
  } else if (currentEssays > 0) {
    essayTrendPercentage = 100;
  }

  const isStudentTrendPositive = studentTrendPercentage >= 0;
  const isEssayTrendPositive = essayTrendPercentage >= 0;

  return {
    students: {
      total: currentStudents,
      trend: `${isStudentTrendPositive ? "+" : ""}${studentTrendPercentage}% este mês`,
      isPositive: isStudentTrendPositive,
    },
    essays: {
      total: pendingEssaysCount || 0,
      trend: `${isEssayTrendPositive ? "+" : ""}${essayTrendPercentage}% envios (vs. mês anterior)`,
      isPositive: isEssayTrendPositive,
    },
  };
}
