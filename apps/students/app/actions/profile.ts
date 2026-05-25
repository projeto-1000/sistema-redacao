"use server";

import { UserData } from "@repo/types";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { SetPasswordSchema } from "@repo/validators";
import { redirect } from "next/navigation";

export async function getProfileData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileRes, creditsRes, statsRes, evolutionRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(`full_name, email, avatar_url, onboarding_completed`)
      .eq("id", user.id)
      .single(),

    supabase.from("student_credits").select("plan_credits").eq("user_id", user.id).maybeSingle(),

    supabase.from("student_performance_stats").select("*").eq("student_id", user.id).maybeSingle(),

    supabase.rpc("get_student_evolution", {
      p_user_id: user.id,
      p_months_count: 6,
    }),
  ]);

  const profile = profileRes.data;
  const credits = creditsRes.data;
  const stats = statsRes.data;
  const evolution = evolutionRes.data;

  if (!profile) {
    throw new Error("Erro de integridade: Perfil ou carteira de créditos não encontrados.");
  }

  return {
    user: {
      name: profile.full_name,
      email: profile.email,
      credits: credits?.plan_credits || 0,
      avatarUrl: profile.avatar_url,
      onboarding_completed: profile?.onboarding_completed,
    } as UserData,
    competencies: {
      C1: stats?.avg_c1 || 0,
      C2: stats?.avg_c2 || 0,
      C3: stats?.avg_c3 || 0,
      C4: stats?.avg_c4 || 0,
      C5: stats?.avg_c5 || 0,
    },
    evolution: evolution?.map((item: { month_text: string; average_score: number }) => ({
      month: item.month_text,
      score: item.average_score,
    })),
    globalStats: {
      totalEssays: stats?.total_essays || 0,
      averageScore: stats?.average_total_score != null ? stats.average_total_score : null,
      bestScore: stats?.best_score ?? null,
      lastScore: stats?.last_score ?? null,
      bestCompetence: stats?.best_competence ?? null,
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
