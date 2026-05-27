"use server";

import { UserData } from "@repo/types";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { SetPasswordSchema } from "@repo/validators";
import { redirect } from "next/navigation";

type ActionResponse = {
  success: boolean;
  error?: string;
  avatarUrl?: string;
};

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
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Erro ao atualizar senha:", error.message);
      return {
        success: false,
        error: "Não foi possível atualizar a senha. O link pode ter expirado.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Erro interno:", err);
    return { success: false, error: "Erro interno no servidor." };
  }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResponse> {
  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "Nenhum arquivo recebido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      const oldFilePath = profile.avatar_url.split("/avatars/").pop();

      if (oldFilePath) {
        const { error: deleteError } = await supabase.storage.from("avatars").remove([oldFilePath]);

        if (deleteError) console.error("Falha ao apagar foto antiga:", deleteError);
      }
    }

    const newFileName = `${user.id}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(newFileName, file, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(newFileName);

    const newAvatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", user.id);

    if (updateError) throw updateError;

    revalidatePath("/perfil", "layout");

    return { success: true, avatarUrl: newAvatarUrl };
  } catch (error) {
    console.error("Erro interno no upload de avatar:", error);
    return { success: false, error: "Falha ao processar a imagem no servidor." };
  }
}

export async function setNewPassword(data: SetPasswordSchema) {
  const { password } = data;
  console.log(password);
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
