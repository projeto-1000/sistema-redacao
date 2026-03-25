"use server";

import { createClient } from "@/lib/server";

import { generateCsv } from "@repo/utils";
import { GetStudentsFilters } from "../types";

type StudentExportRow = {
  full_name: string;
  email: string;
  status: string;
  plan?: string;
  creditsProf?: number | string;
  creditsIA?: number | string;
  validityEnd?: string;
  created_at?: string;
  [key: string]: unknown;
};

export async function exportStudentsCsvAction(filters?: GetStudentsFilters) {
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*").eq("role", "STUDENT");

  if (filters?.search)
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query.order("full_name", { ascending: true });

  if (error) throw new Error("Erro ao buscar dados para exportação");

  const columns = [
    { header: "Nome do Estudante", key: (row: StudentExportRow) => row.full_name },
    { header: "E-mail", key: (row: StudentExportRow) => row.email },
    {
      header: "Status",
      key: (row: StudentExportRow) => {
        if (row.status === "active") return "Ativo";
        if (row.status === "blocked") return "Bloqueado";
        if (row.status === "inactive") return "Inativo";
        return row.status;
      },
    },
    { header: "Plano Atual", key: (row: StudentExportRow) => row.plan || "Basic" },
    {
      header: "Créditos Professor",
      key: (row: StudentExportRow) => row.creditsProf?.toString() || "10",
    },
    { header: "Créditos IA", key: (row: StudentExportRow) => row.creditsIA?.toString() || "5" },
    {
      header: "Vigência do Plano",
      key: (row: StudentExportRow) =>
        row.validityEnd ? new Date(row.validityEnd).toLocaleDateString("pt-BR") : "31/12/2024",
    },
    {
      header: "Data de cadastro",
      key: (row: StudentExportRow) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString("pt-BR") : "",
    },
  ];

  return generateCsv(data, columns);
}
