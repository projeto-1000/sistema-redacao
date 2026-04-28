"use server";

import { createClient } from "@/lib/server";
import { EssayStatus, PendingEssayListItem, PendingEssaysFilter } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
interface GetPendingEssaysParams {
  status: EssayStatus | EssayStatus[];
  filters?: PendingEssaysFilter;
  page?: number;
  limit?: number;
  correctionScope?: "personal" | "others";
}

export async function getEssaysByStatus({
  status,
  filters,
  page = 1,
  limit = 10,
  correctionScope = "personal",
}: GetPendingEssaysParams): Promise<{
  essays: PendingEssayListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase.from("essays").select(
    `
      id, title, thematic_axis, created_at, due_date, status, submission_date,
      student:profiles!essays_student_id_fkey(full_name, avatar_url, email),
      teacher:profiles!essays_teacher_id_fkey(full_name, avatar_url)
    `,
    { count: "exact" }
  );

  if (limit) {
    query = query.limit(limit);
  }

  const statuses = Array.isArray(status) ? status : [status];

  if (correctionScope === "others") {
    query = query.eq("status", "correcting").neq("teacher_id", user.id);
  } else if (statuses.includes("correcting")) {
    const otherStatuses = statuses.filter((s) => s !== "correcting");

    if (otherStatuses.length > 0) {
      query = query.or(
        `status.in.(${otherStatuses.join(",")}),and(status.eq.correcting,teacher_id.eq.${user.id})`
      );
    } else {
      query = query.eq("status", "correcting").eq("teacher_id", user.id);
    }
  } else {
    query = query.in("status", statuses);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,thematic_axis.ilike.%${filters.search}%`);
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
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

  const essays = data.map((essay) => {
    const { student, teacher, ...rest } = essay;

    const studentData = student as unknown as {
      full_name: string;
      avatar_url: string;
      email: string;
    };
    const teacherData = teacher as unknown as { full_name: string; avatar_url: string } | null;

    return {
      ...rest,
      student_name: studentData.full_name,
      avatar_url: studentData.avatar_url,
      email: studentData.email,
      teacher_name: teacherData?.full_name,
      teacher_avatar: teacherData?.avatar_url,
    };
  });

  return {
    essays,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error || null,
  };
}

export async function startEssayCorrection(essayId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { error: updateError } = await supabase
      .from("essays")
      .update({
        teacher_id: user.id,
        started_correction_at: new Date().toISOString(),
        status: "correcting",
      })
      .eq("id", essayId)
      .is("teacher_id", null);

    if (updateError) {
      console.error("🚨 Erro ao vincular professor:", updateError);
      return { success: false, error: "Erro ao iniciar correção." };
    }

    revalidatePath("/redacoes-pendentes");

    return { success: true };
  } catch (error) {
    console.error("🚨 Erro interno:", error);
    return { success: false, error: "Erro inesperado do servidor." };
  }
}
