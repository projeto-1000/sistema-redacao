"use server";

import { createClient } from "@/lib/server";
import {
  AverageTimeRange,
  TeacherEssayFilters,
  GetTeachersFilters,
  TeacherChartData,
  TeacherEssayListItem,
  TeacherListItem,
  TeacherStats,
} from "../../types";
import { revalidatePath } from "next/cache";
import { PostgrestError } from "@supabase/supabase-js";
import {
  createUpdateTeacherProfileSchema,
  type UpdateTeacherProfileInput,
} from "@repo/validators";
import { onlyDigits } from "@repo/utils";

interface GetTeachersParams {
  filters?: GetTeachersFilters;
  page?: number;
  limit?: number;
}

interface GetTeacherEssaysParams {
  teacherId: string;
  filters?: TeacherEssayFilters;
  page?: number;
  limit?: number;
}

export async function getTeachers({
  filters,
  page = 1,
  limit = 10,
}: GetTeachersParams = {}): Promise<{
  teachers: TeacherListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("teacher_stats_view")
    .select(`id, full_name, email, status, avatar_url, total, currentMonth`, { count: "exact" });

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, count, error } = await query
    .order("full_name", { ascending: true })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar lista de professores:", error);
    return { teachers: [], totalPages: 0, error };
  }

  return {
    teachers: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error,
  };
}

export async function getTeacherById(teacherId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("*").eq("id", teacherId).single();

  if (error || !data) {
    console.error("Erro ao buscar detalhes do aluno:", error);
    return null;
  }

  return data;
}

export async function getTeacherStats(teacherId: string): Promise<TeacherStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_teacher_performance_stats", {
    p_teacher_id: teacherId,
  });

  if (error || !data) {
    console.error("Erro ao buscar estatísticas do professor:", error);
    return null;
  }

  const {
    total,
    total_on_time,
    total_late,
    current_month_total,
    current_month_on_time,
    current_month_late,
    last_month_total,
  } = data as {
    total: number;
    total_on_time: number;
    total_late: number;
    current_month_total: number;
    current_month_on_time: number;
    current_month_late: number;
    last_month_total: number;
  };

  let trendText = "Sem dados anteriores";
  let isPositiveTrend = true;

  if (last_month_total > 0) {
    const diff = current_month_total - last_month_total;
    const percentage = Math.round((diff / last_month_total) * 100);

    isPositiveTrend = percentage >= 0;
    const sign = isPositiveTrend ? "+" : "";
    trendText = `${sign}${percentage}% vs anterior`;
  } else if (current_month_total > 0 && last_month_total === 0) {
    trendText = "+100% vs anterior";
    isPositiveTrend = true;
  }

  return {
    monthStats: {
      total: current_month_total,
      onTime: current_month_on_time,
      late: current_month_late,
      trendText,
      isPositiveTrend,
    },
    totalStats: {
      total: total,
      onTime: total_on_time,
      late: total_late,
    },
  };
}

export async function updateTeacherStatus(teacherId: string, currentStatus: string) {
  const supabase = await createClient();
  const newStatus = currentStatus === "active" ? "blocked" : "active";

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", teacherId);

  if (error) {
    console.error("Erro ao alterar status do professor:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/professores");
}

export async function updateTeacherProfile(
  teacherId: string,
  input: UpdateTeacherProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") {
    return { success: false, error: "Apenas administradores podem editar professores." };
  }

  const { data: currentTeacher, error: teacherError } = await supabase
    .from("profiles")
    .select("document")
    .eq("id", teacherId)
    .eq("role", "TEACHER")
    .maybeSingle();

  if (teacherError || !currentTeacher) {
    return { success: false, error: "Professor não encontrado." };
  }

  const validationResult = createUpdateTeacherProfileSchema(
    currentTeacher.document
  ).safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: "Revise os dados informados antes de salvar.",
    };
  }

  const values = validationResult.data;
  const document = onlyDigits(values.document);
  const phone = onlyDigits(values.phone);

  const { data: updatedTeacher, error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: values.full_name,
      document: document || null,
      phone: phone || null,
      correction_review_required: values.correction_review_required,
    })
    .eq("id", teacherId)
    .eq("role", "TEACHER")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Erro ao atualizar perfil do professor:", updateError);

    if (updateError.code === "23505") {
      return { success: false, error: "Este CPF já está associado a outro perfil." };
    }

    return { success: false, error: "Não foi possível atualizar o professor." };
  }

  if (!updatedTeacher) {
    return { success: false, error: "Professor não encontrado." };
  }

  revalidatePath("/professores");
  revalidatePath(`/professores/${teacherId}`);

  return { success: true };
}

export async function getTeacherChartsData(teacherId: string): Promise<TeacherChartData[] | null> {
  const supabase = await createClient();

  const { data: scoreData, error: scoreError } = await supabase.rpc(
    "get_teacher_score_distribution",
    {
      p_teacher_id: teacherId,
    }
  );

  if (scoreError) {
    console.error("Erro ao buscar dados de distribuição de notas:", scoreError);
    return null;
  }

  return scoreData;
}

export async function getAverageTime(teacherId: string, range: AverageTimeRange) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_teacher_average_time", {
    p_teacher_id: teacherId,
    p_range: range,
  });

  if (error) {
    console.error("Erro ao buscar tempo médio de correção:", error);
    return 0;
  }

  return data as number;
}

export async function getTeacherEssays({
  teacherId,
  filters,
  page = 1,
  limit = 10,
}: GetTeacherEssaysParams): Promise<{
  essays: TeacherEssayListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("essays_with_delivery")
    .select(
      `id, 
      student_id, 
      title, 
      thematic_axis, 
      status, 
      correction_date,
      total_score, 
      due_date, 
      is_on_late,
      created_at,
   student_name,
      student_email,
      student_avatar
      `,
      { count: "exact" }
    )
    .eq("teacher_id", teacherId);

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `student_name.ilike.${searchTerm},student_email.ilike.${searchTerm},title.ilike.${searchTerm},thematic_axis.ilike.${searchTerm}`
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

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("correction_date", { ascending: false });

  if (error || !data) {
    console.error(error);
    return { essays: [], totalPages: 0, error };
  }

  return {
    essays: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error,
  };
}
