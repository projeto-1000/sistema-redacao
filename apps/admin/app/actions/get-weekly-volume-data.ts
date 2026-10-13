"use server";
import { createClient } from "@/lib/server";

interface WeeklyEssayVolumeRow {
  chart_date: string;
  sent: number | string;
  corrected: number | string;
}

export async function getWeeklyVolumeData(weeksAgo: number = 0) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_weekly_essay_volume", { weeks_ago: weeksAgo });

  if (error || !data) {
    console.error("Erro ao buscar volume de redações:", error);
    return [];
  }

  const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  const rows = data as WeeklyEssayVolumeRow[];

  const chartData = rows.map((row) => {
    const dateObj = new Date(`${row.chart_date}T12:00:00`);

    return {
      name: daysOfWeek[dateObj.getDay()] ?? "—",
      sent: Number(row.sent),
      corrected: Number(row.corrected),
    };
  });

  return chartData;
}
