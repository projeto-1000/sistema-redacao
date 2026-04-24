import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // Proteção simples para que apenas o Cron chame essa rota
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const year = new Date().getFullYear();

  const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
  const holidays = await res.json();

  const formattedHolidays = holidays.map((h: { date: string; name: string }) => ({
    date: h.date,
    name: h.name,
  }));

  await supabase.from("holidays").upsert(formattedHolidays, { onConflict: "date" });

  return NextResponse.json({ message: "Sincronizado!" });
}
