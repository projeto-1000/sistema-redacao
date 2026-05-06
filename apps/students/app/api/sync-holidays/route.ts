import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Tipagem para a resposta da Brasil API
interface BrasilApiHoliday {
  date: string;
  name: string;
  type: string;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const years = [new Date().getFullYear(), new Date().getFullYear() + 1];

    let allHolidays: BrasilApiHoliday[] = [];

    for (const year of years) {
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      if (!response.ok) continue;

      const data: BrasilApiHoliday[] = await response.json();
      allHolidays = [...allHolidays, ...data];
    }

    const upsertData = allHolidays.map((h) => ({
      date: h.date,
      name: h.name,
    }));

    const { error } = await supabase.from("holidays").upsert(upsertData, { onConflict: "date" });

    if (error) throw error;

    return NextResponse.json(
      { message: "Feriados sincronizados com sucesso!", count: upsertData.length },
      { status: 200 }
    );
  } catch (err) {
    // TODO: disparar algum tipo de alerta em caso de erro
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido ao sincronizar feriados";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
