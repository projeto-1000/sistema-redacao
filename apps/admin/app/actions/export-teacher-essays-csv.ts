"use server";

import { createClient } from "@/lib/server";

import { formatDate, generateCsv } from "@repo/utils";
import { TeacherEssayFilters } from "../../types";

type EssayExportRow = {
  student_name: string;
  title: string;
  thematic_axis: string;
  total_score: number;
  status: string;
  is_on_late?: boolean;
  correction_date?: string | null;
  [key: string]: unknown;
};

interface ExportTeacherPayload {
  teacherId: string;
  filters?: TeacherEssayFilters;
}

export async function exportTeacherEssaysCsv(payload: ExportTeacherPayload) {
  const { teacherId, filters } = payload;

  const supabase = await createClient();

  let query = supabase
    .from("essays_with_delivery")
    .select(
      `student_name,
    title, 
    thematic_axis, 
    status, 
    correction_date,
    total_score, 
    is_on_late`,
      { count: "exact" }
    )
    .eq("teacher_id", teacherId);

  if (filters?.search) {
    query = query.or(
      `student_name.ilike.${filters.search},student_email.ilike.${filters.search},title.ilike.${filters.search},thematic_axis.ilike.${filters.search}`
    );
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.delivery && filters.delivery !== "all") {
    const isLate = filters.delivery === "late";
    query = query.eq("is_on_late", isLate);
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, error } = await query.order("correction_date", { ascending: false });

  if (error) throw new Error("Erro ao buscar dados para exportação");

  const columns = [
    { header: "Nome do Aluno", key: (row: EssayExportRow) => row.student_name },
    { header: "Tema da Redação", key: (row: EssayExportRow) => row.title },
    { header: "Eixo Temático", key: (row: EssayExportRow) => row.thematic_axis },
    {
      header: "Status",
      key: (row: EssayExportRow) => {
        if (row.status === "correcting") return "Em Correção";
        if (row.status === "corrected") return "Corrigida";
        return row.status;
      },
    },
    { header: "Nota Final", key: (row: EssayExportRow) => String(row.total_score) },

    {
      header: "Prazo",
      key: (row: EssayExportRow) => {
        if (row.delivery === "late") return "Em atraso";
        if (row.delivery === "on_time") return "No prazo";
        return "";
      },
    },
    {
      header: "Data de correção",
      key: (row: EssayExportRow) =>
        row.correction_date ? formatDate(row.correction_date, "numeric") : "",
    },
  ];

  return generateCsv(data, columns);
}
