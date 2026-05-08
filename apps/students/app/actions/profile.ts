"use server";

import { UserData } from "@repo/types";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { SetPasswordSchema } from "@repo/validators";

export async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, creditsRes, statsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(`full_name, credits_balance, avatar_url, onboarding_completed`)
      .eq("id", user.id)
      .single(),
    supabase.from("student_credits").select("*").eq("user_id", user.id).single(),
    supabase.from("student_performance_stats").select("*").eq("student_id", user.id).maybeSingle(),
    supabase
      .from("essays")
      .select("created_at, total_score")
      .eq("student_id", user.id)
      .eq("status", "corrected")
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const credits = creditsRes.data;
  const stats = statsRes.data;

  const { data: evolutionGraph } = await supabase.rpc("get_student_evolution", {
    p_user_id: user.id,
    p_months_count: 6,
  });

  return {
    user: {
      name: profile?.full_name || user.user_metadata?.full_name || "Estudante",
      email: user.email,
      credits: credits.plan_credits ?? 0,
      avatarUrl: profile?.avatar_url || null,
      onboarding_completed: profile?.onboarding_completed || null,
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

export async function updateProfile({ name }: { name: string }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);

  if (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw new Error("Não foi possível atualizar o perfil");
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
}

export async function updatePassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Erro ao atualizar senha:", error);
    throw new Error("Não foi possível atualizar a senha");
  }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Usuário não autenticado");

  const file = formData.get("file") as File;
  if (!file) throw new Error("Nenhum arquivo enviado");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    console.error("Erro no storage:", uploadError);
    throw new Error("Falha ao salvar a imagem");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("Erro ao vincular imagem:", updateError);
    throw new Error("Falha ao atualizar a foto no perfil");
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
}

export async function setNewPassword(data: SetPasswordSchema) {
  const { password } = data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado");

  if (!password || password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: {
      role: "STUDENT",
    },
  });

  if (error) {
    return { error: error.message };
  }

  const terms_accepted_at = new Date().toISOString();
  //TODO: descobrir se preciso mesmo mandar a info do onboaarding
  const { error: errorProfile } = await supabase
    .from("profiles")
    .update({ terms_accepted_at, role: "STUDENT", onboarding_completed: false })
    .eq("id", user.id);

  if (errorProfile) {
    return { error: errorProfile.message };
  }

  return { success: true };
}
